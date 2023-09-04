'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaBars } from 'react-icons/fa';
// import { ISearchResult } from '~/helpers/interfaces';

const links = [
  {
    route: '/',
    title: 'Home',
    getIsActive: (pathname: string) => pathname === '/',
  },
  {
    route: '/competitions',
    title: 'Contests',
    getIsActive: (pathname: string) => pathname === '/competitions',
  },
  {
    route: '/rankings',
    title: 'Rankings',
    getIsActive: (pathname: string) => /^\/rankings\//.test(pathname),
  },
  {
    route: '/records',
    title: 'Records',
    getIsActive: (pathname: string) => /^\/records/.test(pathname),
  },
];

const NavbarItems = () => {
  const pathname = usePathname();

  // Whether or not the navbar menu is expanded (mobile-only)
  const [expanded, setExpanded] = useState(false);
  // const [searchTerm, setSearchTerm] = useState<string>('');
  // const [searchResults, setSearchResults] = useState<ISearchResult[]>([
  //   { title: 'Meetup in Munich on June 14, 2023', url: 'http://localhost:3000/contests/Munich14062023' },
  //   { title: 'Meetup in Munich on February 19, 2023', url: 'http://localhost:3000/contests/Munich19022023' },
  // ]);

  // useEffect(() => {
  //   const fetchSearchResults = async () => {
  //     // const res = await fetch('http://localhost:5000/api/contests', {
  //     //   next: { revalidate: 0 },
  //     // });
  //     // const json = await res.json();
  //     // return json.contestsInfo;
  //     await new Promise((resolve) => setTimeout(resolve, 500));
  //     setSearchResults((prevSearchResults) => {
  //       prevSearchResults.pop();
  //       return prevSearchResults;
  //     });
  //   };

  //   fetchSearchResults();
  // }, [searchTerm]);

  return (
    <div className="container-md position-relative">
      <Link className="navbar-brand fs-3" href="/">
        Cubing Contests
      </Link>
      <button className="cc-icon-button d-lg-none" onClick={() => setExpanded(!expanded)} type="button">
        <FaBars />
      </button>
      <div className={'navbar-collapse justify-content-end' + (expanded ? '' : ' collapse')}>
        <ul className="navbar-nav align-items-end gap-lg-4 mt-3 mt-lg-0 mx-2 fs-5">
          {links.map(({ route, title, getIsActive }) => (
            <li key={route} className="nav-item">
              <Link
                className={'nav-link' + (getIsActive(pathname) ? ' active' : '')}
                aria-current="page"
                href={route}
                onClick={() => setExpanded(false)}
              >
                {title}
              </Link>
            </li>
          ))}
        </ul>
        {/* <form className="d-flex mt-3 ms-0 mt-lg-0 ms-lg-4" role="search">
          <input
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control fs-5"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
        </form> */}
      </div>
      {/* {searchResults.length > 0 && searchTerm !== '' && (
        <div className="position-absolute bottom-0 end-0 dropdown">
          <ul className="position-absolute top-0 end-0 mt-3 me-2 dropdown-menu show">
            {searchResults.map((result) => (
              <li key={result.url}>
                <Link href={result.url} className="py-3 dropdown-item">
                  {result.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
};

export default NavbarItems;
