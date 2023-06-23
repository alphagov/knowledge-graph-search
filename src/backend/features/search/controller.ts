import { RequestHandler } from 'express';

class SearchController {
  public search: RequestHandler = (req, res, next) => {
    try {
      res.render('backend/features/search/view.njk');
    } catch (e) {
      next(e);
    }
  };
};

export default SearchController;
