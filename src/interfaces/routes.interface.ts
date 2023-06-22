import { Router } from 'express';

interface Routes {
  path?: string;
  router: Router;
}

export enum Route {
  search = '/',
  getInitData = '/get-init-data',
  searchApi = '/search',
}

export default Routes;
