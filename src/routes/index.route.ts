import { Router } from 'express';
import SearchController from '../features/search/controller';
import Routes, { Route } from '../interfaces/routes.interface';


class IndexRoute implements Routes {
  public router = Router();
  public searchController = new SearchController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      Route.index,
      this.searchController.index,
    );

    this.router.get(
      Route.getInitData,
      this.searchController.getInitData,
    );

    this.router.get(
      Route.searchApi,
      this.searchController.searchApi,
    );

    this.router.get(
      Route.searchTaxon,
      this.searchController.searchTaxon,
    );

  }
}

export default IndexRoute;
