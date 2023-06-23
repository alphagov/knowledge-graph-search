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

    this.router.get(
      Route.infoBoxOrganisation,
      auth(),
      this.searchController.infoBoxOrganisation,
    );

    this.router.get(
      Route.infoBoxRole,
      auth(),
      this.searchController.infoBoxRole,
    );

    this.router.get(
      Route.infoBoxBankHoliday,
      auth(),
      this.searchController.infoBoxBankHoliday,
    );

    this.router.get(
      Route.infoBoxTransaction,
      auth(),
      this.searchController.infoBoxTransaction,
    );

    this.router.get(
      Route.infoBoxPerson,
      auth(),
      this.searchController.infoBoxPerson,
    );

  }
}

export default IndexRoute;
