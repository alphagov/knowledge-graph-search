import { InitResults, SearchResults, SearchParams, Person, Organisation, BankHoliday, Transaction, Role, Taxon } from './src/ts/search-api-types';


// export type GetRoleInfoSignature = (str: string) => Promise<Role>;
export type GetOrganisationInfoSignature = (str: string) => Promise<Organisation>;
export type GetTaxonInfoSignature = (str: string) => Promise<Taxon>;
export type GetBankHolidayInfoSignature = (str: string) => Promise<BankHoliday>;
export type GetTransactionInfoSignature = (str: string) => Promise<Transaction>;
// export type GetPersonInfoSignature = (str: string) => Promise<Person>;
export type SendSearchQuerySignature = (str: SearchParams) => Promise<SearchResults>
export type SendInitQuerySignature = () => Promise<InitResults>
