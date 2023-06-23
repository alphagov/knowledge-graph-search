import { Router } from 'express';
import SearchController from '../features/search/controller';
import Routes, { Route } from '../interfaces/routes';
import { auth } from '../../backend/middleware/auth';

class IndexRoute implements Routes {
  public router = Router();
  public searchController = new SearchController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      Route.index,
      auth(),
      this.searchController.index,
    );

    this.router.get(
      Route.getInitData,
      auth(),
      this.searchController.getInitData,
    );

    this.router.get(
      Route.searchApi,
      auth(),
      this.searchController.searchApi,
    );

    this.router.get(
      Route.searchTaxon,
      auth(),
      this.searchController.searchTaxon,
    );

    this.router.get(
      Route.downladCSV,
      auth(),
      this.searchController.downladCSV,
    );

  }
}

export default IndexRoute;
