import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import IRecordType from '@sh/interfaces/RecordType';
import { RecordTypeDocument } from '~/src/models/record-type.model';
import { ResultDocument } from '~/src/models/result.model';
import { EventDocument } from '~/src/models/event.model';
import { WcaRecordType } from '@sh/enums';

@Injectable()
export class RecordTypesService {
  constructor(
    @InjectModel('RecordType') private readonly recordTypeModel: Model<RecordTypeDocument>,
    @InjectModel('Result') private readonly resultModel: Model<ResultDocument>,
    @InjectModel('Event') private readonly eventModel: Model<Event>,
  ) {}

  async getRecordTypes(query?: any): Promise<RecordTypeDocument[]> {
    try {
      return await this.recordTypeModel.find(query);
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async createOrEditRecordTypes(newRecordTypes: IRecordType[]) {
    // If there were already record types in the DB, delete them and create new ones
    let recordTypes;
    try {
      recordTypes = await this.recordTypeModel.find();
      if (recordTypes.length > 0) await this.recordTypeModel.deleteMany({});
      await this.recordTypeModel.create(newRecordTypes);
    } catch (err) {
      throw new InternalServerErrorException(`Error while creating record types: ${err.message}`);
    }

    // Set the records
    for (let i = 0; i < newRecordTypes.length; i++) {
      // FOR NOW THIS ONLY WORKS FOR WR!!!
      if (newRecordTypes[i].wcaEquivalent !== WcaRecordType.WR) break;

      // Remove records if set to inactive but was active before, or set the records for the opposite case
      if (!newRecordTypes[i].active && recordTypes[i]?.active) {
        console.log(`Unsetting ${newRecordTypes[i].label} records`);

        await this.resultModel.updateMany(
          { regionalSingleRecord: newRecordTypes[i].label },
          { $unset: { regionalSingleRecord: '' } },
        );
        await this.resultModel.updateMany(
          { regionalAverageRecord: newRecordTypes[i].label },
          { $unset: { regionalAverageRecord: '' } },
        );
      } else if (newRecordTypes[i].active && !recordTypes[i]?.active) {
        console.log(`Setting ${newRecordTypes[i].label} records`);

        try {
          const events: EventDocument[] = await this.eventModel.find();

          for (const event of events) {
            // Set single records
            let bestResult = Infinity;
            const bestSinglesByDay = await this.resultModel
              .aggregate([
                { $match: { eventId: event.eventId, best: { $gt: 0 } } },
                { $sort: { date: 1 } },
                {
                  $group: {
                    _id: '$date',
                    best: { $min: '$best' },
                  },
                },
                { $sort: { _id: 1 } }, // for some reason the group stage breaks the ordering by date
              ])
              .exec();

            // THIS SEEMS SUBOPTIMAL, MAYBE DO THIS DIRECTLY IN THE QUERY SOMEHOW
            const singleRecords = bestSinglesByDay.filter((res) => {
              if (res.best <= bestResult) {
                bestResult = res.best;
                return true;
              }
              return false;
            });

            for (const singleRecord of singleRecords) {
              console.log(`New single ${newRecordTypes[i].label} for event ${event.eventId}: ${singleRecord.best}`);
              await this.resultModel
                .updateOne(
                  {
                    eventId: event.eventId,
                    date: singleRecord._id, // _id is actually the date from the group stage
                    best: singleRecord.best,
                  },
                  { $set: { regionalSingleRecord: newRecordTypes[i].label } },
                )
                .exec();
            }

            // Set average records
            const bestAvgsByDay = await this.resultModel
              .aggregate([
                { $match: { eventId: event.eventId, average: { $gt: 0 } } },
                { $sort: { date: 1 } },
                {
                  $group: {
                    _id: '$date',
                    average: { $min: '$average' },
                  },
                },
                { $sort: { _id: 1 } },
              ])
              .exec();

            bestResult = Infinity;
            const avgRecords = bestAvgsByDay.filter((res) => {
              if (res.average <= bestResult) {
                bestResult = res.average;
                return true;
              }
              return false;
            });

            for (const avgRecord of avgRecords) {
              console.log(`New average ${newRecordTypes[i].label} for event ${event.eventId}: ${avgRecord.average}`);

              await this.resultModel
                .updateOne(
                  {
                    eventId: event.eventId,
                    date: avgRecord._id, // _id is actually the date from the group stage
                    average: avgRecord.average,
                  },
                  { $set: { regionalAverageRecord: newRecordTypes[i].label } },
                )
                .exec();
            }
          }
        } catch (err) {
          throw new InternalServerErrorException(`Error while setting initial ${newRecordTypes[i].label} records`);
        }
      }
    }
  }
}
