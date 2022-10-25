(() => {
    const defines = {};
    const entry = [null];
    function define(name, dependencies, factory) {
        defines[name] = { dependencies, factory };
        entry[0] = name;
    }
    define("require", ["exports"], (exports) => {
        Object.defineProperty(exports, "__cjsModule", { value: true });
        Object.defineProperty(exports, "default", { value: (name) => resolve(name) });
    });
    define("utils", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.getFormInputValue = exports.splitKeywords = exports.sanitiseOutput = exports.sanitiseInput = exports.id = void 0;
        const id = (x) => document.getElementById(x);
        exports.id = id;
        const tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
        const tagOrComment = new RegExp('<(?:'
            // Comment body.
            + '!--(?:(?:-*[^->])*--+|-?)'
            // Special "raw text" elements whose content should be elided.
            + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
            + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
            // Regular name
            + '|/?[a-z]'
            + tagBody
            + ')>', 'gi');
        const getFormInputValue = (inputId) => { var _a; return sanitiseInput((_a = id(inputId)) === null || _a === void 0 ? void 0 : _a.value); };
        exports.getFormInputValue = getFormInputValue;
        const sanitiseInput = function (text) {
            // remove text that could lead to script injections
            if (!text)
                return '';
            let oldText;
            do {
                oldText = text;
                text = text.replace(tagOrComment, '');
            } while (text !== oldText);
            return text.replace(/</g, '&lt;').replace(/""*/g, '"');
        };
        exports.sanitiseInput = sanitiseInput;
        const sanitiseOutput = function (text) {
            const escapeHTML = (str) => new Option(str).innerHTML;
            return escapeHTML(text)
                .replace(/'/g, '&apos;')
                .replace(/"/g, '&quot;');
        };
        exports.sanitiseOutput = sanitiseOutput;
        const splitKeywords = function (keywords) {
            const wordsToIgnore = ['of', 'for', 'the'];
            const regexp = /[^\s,"]+|"([^"]*)"/gi;
            const output = [];
            let match;
            do {
                match = regexp.exec(keywords);
                if (match) {
                    output.push(match[1] ? match[1] : match[0]);
                }
            } while (match);
            return output.filter(d => d.length > 0 && !wordsToIgnore.includes(d));
        };
        exports.splitKeywords = splitKeywords;
    });
    // Functions to work with languages and language codes
    define("lang", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.languageName = exports.languageCode = void 0;
        const languageCode = (name) => 
        // returns the language code from the language's full name
        Object.keys(languageNames).find(key => languageNames[key] === name) || name;
        exports.languageCode = languageCode;
        const languageName = (code) => 
        // returns the language name from the language's code
        languageNames[code] || code;
        exports.languageName = languageName;
        // IETF language codes https://en.wikipedia.org/wiki/IETF_language_tag
        // with additions
        const languageNames = {
            '': 'All languages',
            'af': 'Afrikaans',
            'am': 'Amharic',
            'ar': 'Arabic',
            'arn': 'Mapudungun',
            'as': 'Assamese',
            'az': 'Azeri',
            'ba': 'Bashkir',
            'be': 'Belarusian',
            'bg': 'Bulgarian',
            'bn': 'Bengali',
            'bo': 'Tibetan',
            'br': 'Breton',
            'bs': 'Bosnian',
            'ca': 'Catalan',
            'co': 'Corsican',
            'cs': 'Czech',
            'cy': 'Welsh',
            'da': 'Danish',
            'de': 'German',
            'dr': 'Dari',
            'dsb': 'Lower Sorbian',
            'dv': 'Divehi',
            'el': 'Greek',
            'en': 'English',
            'es': 'Spanish',
            'es-419': 'Latin-american Spanish',
            'et': 'Estonian',
            'eu': 'Basque',
            'fa': 'Persian',
            'fi': 'Finnish',
            'fil': 'Filipino',
            'fo': 'Faroese',
            'fr': 'French',
            'fy': 'Frisian',
            'ga': 'Irish',
            'gd': 'Scottish Gaelic',
            'gl': 'Galician',
            'gsw': 'Alsatian',
            'gu': 'Gujarati',
            'ha': 'Hausa',
            'he': 'Hebrew',
            'hi': 'Hindi',
            'hr': 'Croatian',
            'hsb': 'Upper Sorbian',
            'hu': 'Hungarian',
            'hy': 'Armenian',
            'id': 'Indonesian',
            'ig': 'Igbo',
            'ii': 'Yi',
            'is': 'Icelandic',
            'it': 'Italian',
            'iu': 'Inuktitut',
            'ja': 'Japanese',
            'ka': 'Georgian',
            'kk': 'Kazakh',
            'kl': 'Greenlandic',
            'km': 'Khmer',
            'kn': 'Kannada',
            'ko': 'Korean',
            'kok': 'Konkani',
            'ky': 'Kyrgyz',
            'lb': 'Luxembourgish',
            'lo': 'Lao',
            'lt': 'Lithuanian',
            'lv': 'Latvian',
            'mi': 'Maori',
            'mk': 'Macedonian',
            'ml': 'Malayalam',
            'mn': 'Mongolian',
            'moh': 'Mohawk',
            'mr': 'Marathi',
            'ms': 'Malay',
            'mt': 'Maltese',
            'my': 'Burmese',
            'nb': 'Norwegian (Bokmål)',
            'ne': 'Nepali',
            'nl': 'Dutch',
            'nn': 'Norwegian (Nynorsk)',
            'no': 'Norwegian',
            'nso': 'Sesotho',
            'oc': 'Occitan',
            'or': 'Oriya',
            'pa': 'Punjabi',
            'pa-pk': 'Punjabi (Pakistan)',
            'pl': 'Polish',
            'prs': 'Dari',
            'ps': 'Pashto',
            'pt': 'Portuguese',
            'qut': 'K\'iche',
            'quz': 'Quechua',
            'rm': 'Romansh',
            'ro': 'Romanian',
            'ru': 'Russian',
            'rw': 'Kinyarwanda',
            'sa': 'Sanskrit',
            'sah': 'Yakut',
            'se': 'Sami (Northern)',
            'si': 'Sinhala',
            'sk': 'Slovak',
            'sl': 'Slovenian',
            'sma': 'Sami (Southern)',
            'smj': 'Sami (Lule)',
            'smn': 'Sami (Inari)',
            'sms': 'Sami (Skolt)',
            'so': 'Somani',
            'sq': 'Albanian',
            'sr': 'Serbian',
            'sv': 'Swedish',
            'sw': 'Kiswahili',
            'syr': 'Syriac',
            'ta': 'Tamil',
            'te': 'Telugu',
            'tg': 'Tajik',
            'th': 'Thai',
            'tk': 'Turkmen',
            'tn': 'Setswana',
            'tr': 'Turkish',
            'tt': 'Tatar',
            'tzm': 'Tamazight',
            'ug': 'Uyghur',
            'uk': 'Ukrainian',
            'ur': 'Urdu',
            'uz': 'Uzbek',
            'vi': 'Vietnamese',
            'wo': 'Wolof',
            'xh': 'isiXhosa',
            'yi': 'Yiddish',
            'yo': 'Yoruba',
            'zh': 'Chinese',
            'zh-hk': 'Chinese (Hong-Kong)',
            'zh-tw': 'Chinese (Taiwan)',
            'zu': 'isiZulu'
        };
    });
    define("state-types", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.SearchArea = exports.Combinator = exports.SearchType = void 0;
        var SearchType;
        (function (SearchType) {
            SearchType["Keyword"] = "keyword";
            SearchType["Link"] = "link";
            SearchType["Taxon"] = "taxon";
            SearchType["Language"] = "language";
            SearchType["Mixed"] = "mixed";
            SearchType["Results"] = "results";
        })(SearchType = exports.SearchType || (exports.SearchType = {}));
        ;
        var Combinator;
        (function (Combinator) {
            Combinator["Any"] = "any";
            Combinator["All"] = "all";
            Combinator["NotSet"] = "notset";
        })(Combinator = exports.Combinator || (exports.Combinator = {}));
        var SearchArea;
        (function (SearchArea) {
            SearchArea["Any"] = "any";
            SearchArea["Whitehall"] = "whitehall";
            SearchArea["Mainstream"] = "mainstream";
        })(SearchArea = exports.SearchArea || (exports.SearchArea = {}));
    });
    define("state", ["require", "exports", "lang", "state-types"], function (require, exports, lang_1, state_types_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.resetSearch = exports.searchState = exports.setQueryParamsFromQS = exports.state = void 0;
        // user inputs that are used to build the query.
        // (basically, everything whose value could be found in the URL)
        // Separate from (but included in)  state to make
        // it easier to reset to those initial
        // values only while keeping the rest of the state
        const initialSearchParams = {
            searchType: state_types_1.SearchType.Keyword,
            selectedWords: '',
            excludedWords: '',
            selectedTaxon: '',
            selectedLocale: '',
            linkSearchUrl: '',
            whereToSearch: {
                title: true,
                text: true // whether search should include page content
            },
            combinator: state_types_1.Combinator.Any,
            areaToSearch: state_types_1.SearchArea.Any,
            caseSensitive: false,
            displayFeedbackBanner: true, // whether we should show the banner requesting feedback from user.
        };
        const state = Object.assign(Object.assign({}, initialSearchParams), { taxons: [], locales: [], errorText: null, userErrors: [], nbResultsLimit: 50000, searchResults: null, metaSearchResults: null, skip: 0, resultsPerPage: 10, showFields: {
                url: true,
                title: true
            }, waiting: false, disamboxExpanded: false // if there's a resizeable disamb meta box, whether it's expanded or not
         });
        exports.state = state;
        const setQueryParamsFromQS = function () {
            const searchParams = new URLSearchParams(window.location.search);
            const maybeReplace = (stateField, qspName) => searchParams.get(qspName) !== null ? searchParams.get(qspName) : initialSearchParams[stateField];
            state.searchType = maybeReplace('searchType', 'search-type');
            state.selectedWords = maybeReplace('selectedWords', 'selected-words');
            state.excludedWords = maybeReplace('excludedWords', 'excluded-words');
            state.linkSearchUrl = maybeReplace('linkSearchUrl', 'link-search-url');
            state.selectedTaxon = maybeReplace('selectedTaxon', 'selected-taxon');
            const lang = searchParams.get('lang');
            state.selectedLocale = lang ? (0, lang_1.languageName)(lang) : initialSearchParams.selectedLocale;
            state.caseSensitive = maybeReplace('caseSensitive', 'case-sensitive');
            state.areaToSearch = maybeReplace('areaToSearch', 'area');
            state.combinator = maybeReplace('combinator', 'combinator');
            state.whereToSearch.title = searchParams.get('search-in-title') !== null ?
                !!searchParams.get('search-in-title') :
                initialSearchParams.whereToSearch.title;
            state.whereToSearch.text = searchParams.get('search-in-text') !== null ?
                !!searchParams.get('search-in-text') :
                initialSearchParams.whereToSearch.text;
        };
        exports.setQueryParamsFromQS = setQueryParamsFromQS;
        const searchState = function () {
            // Find out what to display depending on state
            // returns an object with a "code" field
            // "no-results": there was a search but no results were returned
            // "results": there was a search and there are results to display
            // "initial": there weren't any search criteria specified
            // "errors": the user didn't specify a valid query. In this case
            //   we add a "errors" fiels containing an array with values among:
            //   - "missingWhereToSearch": keywords were specified but not where to look for them on pages
            //   - "missingArea": no publishing platform was specified
            //   - "missingCombinator": no keyword combinator was specified
            // "waiting": there's a query running
            const errors = [];
            if (state.waiting)
                return { code: 'waiting', errors };
            if (state.selectedWords === '' && state.excludedWords === '' && state.selectedTaxon === '' && state.selectedLocale === '' && state.linkSearchUrl === '' && state.whereToSearch.title === false && state.whereToSearch.text === false) {
                return { code: 'initial', errors };
            }
            if (state.selectedWords !== '') {
                if (!state.whereToSearch.title && !state.whereToSearch.text) {
                    errors.push('missingWhereToSearch');
                }
            }
            if (errors.length > 0)
                return { code: 'error', errors };
            if (state.searchResults && state.searchResults.length > 0)
                return { code: 'results', errors };
            if (state.searchResults && state.searchResults.length === 0)
                return { code: 'no-results', errors };
            return { code: 'ready-to-search', errors };
        };
        exports.searchState = searchState;
        const resetSearch = function () {
            state.selectedWords = '';
            state.excludedWords = '';
            state.selectedTaxon = '';
            state.selectedLocale = '';
            state.whereToSearch.title = true;
            state.whereToSearch.text = false;
            state.caseSensitive = false;
            state.linkSearchUrl = '';
            state.skip = 0; // reset to first page
            state.areaToSearch = state_types_1.SearchArea.Any;
            state.searchResults = null;
            state.waiting = false;
            state.combinator = state_types_1.Combinator.All;
        };
        exports.resetSearch = resetSearch;
    });
    define("event-types", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.EventType = void 0;
        var EventType;
        (function (EventType) {
            EventType[EventType["Dom"] = 0] = "Dom";
            EventType[EventType["Neo4jRunning"] = 1] = "Neo4jRunning";
            EventType[EventType["Neo4jCallbackOk"] = 2] = "Neo4jCallbackOk";
            EventType[EventType["Neo4jCallbackFail"] = 3] = "Neo4jCallbackFail";
        })(EventType = exports.EventType || (exports.EventType = {}));
    });
    define("neo4j-types", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
    });
    //==================================================
    // Cypher query methods
    //==================================================
    define("neo4j", ["require", "exports", "state", "lang", "utils", "event-types"], function (require, exports, state_1, lang_2, utils_1, event_types_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.initNeo4j = exports.queryGraph = exports.searchQuery = void 0;
        //=========== public methods ===========
        const initNeo4j = async function () {
            console.log('retrieving taxons and locales');
            try {
                const neo4jResponse = await queryNeo4j([
                    { statement: 'MATCH (t:Taxon) RETURN t.name' },
                    { statement: 'MATCH (n:Page) WHERE n.locale <> "en" AND n.locale <> "cy" RETURN DISTINCT n.locale' }
                ], 10);
                const json = await neo4jResponse.json();
                state_1.state.taxons = json.results[0].data.map((d) => d.row[0]).sort();
                state_1.state.locales = json.results[1].data.map((d) => d.row[0]).sort();
                state_1.state.locales = ['', 'en', 'cy'].concat(state_1.state.locales);
                console.log(`successfully fetched ${state_1.state.taxons.length} taxons and ${state_1.state.locales.length} locales`);
            }
            catch (error) {
                state_1.state.errorText = 'Error retrieving taxons and locales';
                console.log('Error retrieving taxons and locales', error);
            }
        };
        exports.initNeo4j = initNeo4j;
        const queryGraph = async function (state, callback) {
            const mainCypherQuery = { statement: searchQuery(state) };
            const searchKeywords = state.selectedWords.replace(/"/g, '');
            const wholeQuery = [mainCypherQuery];
            if (searchKeywords.length >= 5 && searchKeywords.includes(' ')) {
                const metaSearchQuery = {
                    statement: `
            MATCH (node)
            WHERE (node:BankHoliday OR node:Organisation)
            AND toLower(node.name) CONTAINS toLower($keywords)
            OPTIONAL MATCH (node)-[:HAS_HOMEPAGE]->(homepage:Page)
            RETURN node, homepage, labels(node) as nodeType`,
                    parameters: {
                        keywords: searchKeywords
                    }
                };
                wholeQuery.push(metaSearchQuery);
            }
            callback({ type: event_types_1.EventType.Neo4jRunning });
            queryNeo4j(wholeQuery)
                .then(response => response.json())
                .then(async (json) => {
                const mainResults = formattedSearchResults(json.results[0]);
                let metaResults = json.results.length > 1 && json.results[1].data.length > 0 ?
                    formattedSearchResults(json.results[1]) :
                    [];
                // If there's an exact match, just keep it
                const exactMetaResults = metaResults.filter((result) => {
                    return result.node.name.toLowerCase() === searchKeywords.toLowerCase();
                });
                if (exactMetaResults.length === 1) {
                    metaResults = exactMetaResults;
                }
                if (metaResults.length === 1) {
                    // one meta result: show the knowledge panel (may require more neo4j queries)
                    const fullMetaResults = await buildMetaboxInfo(metaResults[0]);
                    callback({ type: event_types_1.EventType.Neo4jCallbackOk, results: { main: mainResults, meta: [fullMetaResults] } });
                }
                else if (metaResults.length >= 1) {
                    // multiple meta results: we'll show a disambiguation page
                    callback({ type: event_types_1.EventType.Neo4jCallbackOk, results: { main: mainResults, meta: metaResults } });
                }
                else {
                    // no meta results
                    callback({ type: event_types_1.EventType.Neo4jCallbackOk, results: { main: mainResults, meta: null } });
                }
            })
                .catch(error => {
                console.log('error running main+meta queries', error);
                callback({ type: event_types_1.EventType.Neo4jCallbackFail, error });
            });
        };
        exports.queryGraph = queryGraph;
        //=========== private ===========
        const buildMetaboxInfo = async function (info) {
            console.log(`Found a ${info.nodeType[0]}. Running extra queries`);
            const result = { type: info.nodeType[0], name: info.node.name };
            let json;
            let orgData, orgDetails, childDetails, parentDetails;
            let holidayData;
            switch (info.nodeType[0]) {
                // We found a bank holiday, so we need to run 2 further queries
                // one to get the dates, the other to get the regions
                case 'BankHoliday':
                    holidayData = await queryNeo4j([
                        {
                            statement: `
              MATCH (b:BankHoliday)-[:IS_ON]->(d)
              WHERE b.name = $name
              RETURN d`,
                            parameters: { name: info.node.name }
                        }, {
                            statement: `
              MATCH (b:BankHoliday)-[:IS_OBSERVED_IN]->(r)
              WHERE b.name = $name
              RETURN r`,
                            parameters: { name: info.node.name }
                        }
                    ]);
                    json = await holidayData.json();
                    result.dates = json.results[0].data.map((record) => record.row[0]);
                    result.regions = json.results[1].data.map((record) => record.row[0].name);
                    break;
                case 'Organisation':
                    // We found an organisation, so we need to run a further query
                    // to get the sub organisations
                    orgData = await queryNeo4j([
                        {
                            statement: `
              MATCH (org:Organisation)-[:HAS_HOMEPAGE]->(homepage:Page)
              WHERE org.name = $name
              RETURN homepage.description, homepage.url`,
                            parameters: { name: info.node.name }
                        }, {
                            statement: `
              MATCH (org:Organisation)-[:HAS_CHILD_ORGANISATION]->(childOrg:Organisation)
              WHERE org.name = $name
              AND childOrg.status <> "closed"
              RETURN childOrg.name`,
                            parameters: { name: info.node.name }
                        }, {
                            statement: `
              MATCH (org:Organisation)-[:HAS_PARENT_ORGANISATION]->(parentOrg:Organisation)
              WHERE org.name = $name
              RETURN parentOrg.name`,
                            parameters: { name: info.node.name }
                        }
                    ]);
                    json = await orgData.json();
                    orgDetails = json.results[0].data[0].row;
                    childDetails = json.results[1].data;
                    parentDetails = json.results[2].data;
                    result.homepage = orgDetails[1];
                    result.description = orgDetails[0];
                    result.parentName = parentDetails.length === 1 ?
                        parentDetails[0].row[0] : null;
                    result.childOrgNames = childDetails.map((child) => child.row[0]);
                    break;
                default:
                    console.log('unknown meta node type', info.nodeType[0]);
            }
            console.log('result', result);
            return result;
        };
        const searchQuery = function (state) {
            const fieldsToSearch = [];
            const keywords = (0, utils_1.splitKeywords)(state.selectedWords);
            const excludedKeywords = (0, utils_1.splitKeywords)(state.excludedWords);
            const combinator = state.combinator === 'any' ? 'OR' : 'AND';
            if (state.whereToSearch.title)
                fieldsToSearch.push('title');
            if (state.whereToSearch.text)
                fieldsToSearch.push('text', 'description');
            let inclusionClause = '';
            if (keywords.length > 0) {
                inclusionClause = 'WITH * WHERE\n' +
                    keywords
                        .map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive))
                        .join(`\n ${combinator}`);
            }
            const exclusionClause = excludedKeywords.length ?
                ('WITH * WHERE NOT ' + excludedKeywords.map(word => multiContainsClause(fieldsToSearch, word, state.caseSensitive)).join(`\n OR `)) : '';
            let areaClause = '';
            if (state.areaToSearch === 'mainstream') {
                areaClause = 'WITH * WHERE n.publishingApp = "publisher"';
            }
            else if (state.areaToSearch === 'whitehall') {
                areaClause = 'WITH * WHERE n.publishingApp = "whitehall"';
            }
            let localeClause = '';
            if (state.selectedLocale !== '') {
                localeClause = `WITH * WHERE n.locale = "${(0, lang_2.languageCode)(state.selectedLocale)}"\n`;
            }
            const taxon = state.selectedTaxon;
            const taxonClause = taxon ? `
        WITH n
        MATCH (n:Page)-[:IS_TAGGED_TO]->(taxon:Taxon)
        MATCH (taxon:Taxon)-[:HAS_PARENT*]->(ancestor_taxon:Taxon)
        WHERE taxon.name = "${taxon}" OR ancestor_taxon.name = "${taxon}"` :
                `OPTIONAL MATCH (n:Page)-[:IS_TAGGED_TO]->(taxon:Taxon)`;
            let linkClause = '';
            if (state.linkSearchUrl.length > 0) {
                // We need to determine if the link is internal or external
                const internalLinkRexExp = /^((https:\/\/)?((www\.)?gov\.uk))?\//;
                if (internalLinkRexExp.test(state.linkSearchUrl)) {
                    linkClause = `
            WITH n, taxon
            MATCH (n:Page)-[:HYPERLINKS_TO]->(n2:Page)
            WHERE n2.url = "https://www.gov.uk${state.linkSearchUrl.replace(internalLinkRexExp, '/')}"`;
                }
                else {
                    linkClause = `
            WITH n, taxon
            MATCH (n:Page) -[:HYPERLINKS_TO]-> (e:ExternalPage)
            WHERE e.url CONTAINS "${state.linkSearchUrl}"`;
                }
            }
            return `
        MATCH (n:Page)
        WHERE NOT n.documentType IN ['gone', 'redirect', 'placeholder', 'placeholder_person']
        ${inclusionClause}
        ${exclusionClause}
        ${localeClause}
        ${areaClause}
        ${taxonClause}
        ${linkClause}
        OPTIONAL MATCH (n:Page)-[r:HAS_PRIMARY_PUBLISHING_ORGANISATION]->(o:Organisation)
        OPTIONAL MATCH (n:Page)-[:HAS_ORGANISATIONS]->(o2:Organisation)
        ${returnClause()}`;
        };
        exports.searchQuery = searchQuery;
        //========== Private methods ==========
        const queryNeo4j = async function (queries, timeoutSeconds = 60) {
            const body = { statements: queries };
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
            console.log('sending query to neo4j:', body);
            return fetch('/neo4j', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
        };
        const containsClause = function (field, word, caseSensitive) {
            return caseSensitive ?
                `(n.${field} CONTAINS "${word}")`
                :
                    `(toLower(n.${field}) CONTAINS toLower("${word}"))`;
        };
        const multiContainsClause = function (fields, word, caseSensitive) {
            return '(' + fields
                .map(field => containsClause(field, word, caseSensitive))
                .join(' OR ') + ')';
        };
        const returnClause = function () {
            return `RETURN
        n.url as url,
        n.title AS title,
        n.documentType AS documentType,
        n.contentID AS contentID,
        n.locale AS locale,
        n.publishingApp AS publishing_app,
        n.firstPublishedAt AS first_published_at,
        n.publicUpdatedAt AS public_updated_at,
        n.withdrawnAt AS withdrawn_at,
        n.withdrawnExplanation AS withdrawn_explanation,
        n.pagerank AS pagerank,
        COLLECT (distinct taxon.name) AS taxons,
        COLLECT (distinct o.name) AS primary_organisation,
        COLLECT (distinct o2.name) AS all_organisations
        ORDER BY n.pagerank DESC
        LIMIT ${state_1.state.nbResultsLimit}`;
        };
        const formattedSearchResults = (neo4jResults) => {
            const keys = neo4jResults.columns;
            const results = [];
            neo4jResults.data.forEach(val => {
                const result = {};
                keys.forEach((key, i) => result[key] = val.row[i]);
                results.push(result);
            });
            return results;
        };
    });
    define("events", ["require", "exports", "state", "utils", "view/view", "lang", "neo4j", "event-types", "state-types"], function (require, exports, state_2, utils_2, view_1, lang_3, neo4j_1, event_types_2, state_types_2) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.searchButtonClicked = exports.handleEvent = void 0;
        const handleEvent = async function (event) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            let fieldClicked;
            console.log('handleEvent:', event.type, event.id || '');
            switch (event.type) {
                case event_types_2.EventType.Dom:
                    switch (event.id) {
                        case 'search':
                            // Tell GTM a search is starting
                            (_a = window.dataLayer) === null || _a === void 0 ? void 0 : _a.push({
                                'event': 'formSubmission',
                                'formType': 'Search',
                                'formPosition': 'Page'
                            });
                            // Update the state
                            state_2.state.selectedWords = (0, utils_2.getFormInputValue)('keyword');
                            state_2.state.excludedWords = (0, utils_2.getFormInputValue)('excluded-keyword');
                            state_2.state.selectedTaxon = (0, utils_2.getFormInputValue)('taxon');
                            state_2.state.selectedLocale = (0, utils_2.getFormInputValue)('locale');
                            state_2.state.whereToSearch.title = (_b = (0, utils_2.id)('search-title')) === null || _b === void 0 ? void 0 : _b.checked;
                            state_2.state.whereToSearch.text = (_c = (0, utils_2.id)('search-text')) === null || _c === void 0 ? void 0 : _c.checked;
                            state_2.state.caseSensitive = (_d = (0, utils_2.id)('case-sensitive')) === null || _d === void 0 ? void 0 : _d.checked;
                            state_2.state.linkSearchUrl = (0, utils_2.getFormInputValue)('link-search');
                            state_2.state.skip = 0; // reset to first page
                            if ((_e = (0, utils_2.id)('area-mainstream')) === null || _e === void 0 ? void 0 : _e.checked)
                                state_2.state.areaToSearch = state_types_2.SearchArea.Mainstream;
                            if ((_f = (0, utils_2.id)('area-whitehall')) === null || _f === void 0 ? void 0 : _f.checked)
                                state_2.state.areaToSearch = state_types_2.SearchArea.Whitehall;
                            if ((_g = (0, utils_2.id)('area-any')) === null || _g === void 0 ? void 0 : _g.checked)
                                state_2.state.areaToSearch = state_types_2.SearchArea.Any;
                            if ((_h = (0, utils_2.id)('combinator-any')) === null || _h === void 0 ? void 0 : _h.checked)
                                state_2.state.combinator = state_types_2.Combinator.Any;
                            if ((_j = (0, utils_2.id)('combinator-all')) === null || _j === void 0 ? void 0 : _j.checked)
                                state_2.state.combinator = state_types_2.Combinator.All;
                            state_2.state.searchResults = null;
                            searchButtonClicked();
                            break;
                        case 'button-next-page':
                            state_2.state.skip = state_2.state.skip + state_2.state.resultsPerPage;
                            updateUrl();
                            break;
                        case 'button-prev-page':
                            state_2.state.skip = Math.max(state_2.state.skip - state_2.state.resultsPerPage, 0);
                            updateUrl();
                            break;
                        case 'dismiss-feedback-banner':
                            state_2.state.displayFeedbackBanner = false;
                            document.cookie = 'feedback_banner_dismissed=true';
                            break;
                        case 'toggleDisamBox':
                            state_2.state.disamboxExpanded = !state_2.state.disamboxExpanded;
                            break;
                        case 'search-keyword':
                            (0, state_2.resetSearch)();
                            state_2.state.searchType = state_types_2.SearchType.Keyword;
                            break;
                        case 'search-link':
                            (0, state_2.resetSearch)();
                            state_2.state.searchType = state_types_2.SearchType.Link;
                            break;
                        case 'search-taxon':
                            (0, state_2.resetSearch)();
                            state_2.state.searchType = state_types_2.SearchType.Taxon;
                            break;
                        case 'search-language':
                            (0, state_2.resetSearch)();
                            state_2.state.searchType = state_types_2.SearchType.Language;
                            break;
                        case 'search-mixed':
                            (0, state_2.resetSearch)();
                            state_2.state.searchType = state_types_2.SearchType.Mixed;
                            break;
                        default:
                            fieldClicked = event.id ? event.id.match(/show-field-(.*)/) : null;
                            if (fieldClicked && event.id) {
                                state_2.state.showFields[fieldClicked[1]] = (_k = (0, utils_2.id)(event.id)) === null || _k === void 0 ? void 0 : _k.checked;
                            }
                            else {
                                console.log('unknown DOM event received:', event);
                            }
                            console.log('unknown DOM event received:', event);
                    }
                    break;
                // non-dom events
                case event_types_2.EventType.Neo4jRunning:
                    state_2.state.waiting = true;
                    break;
                case event_types_2.EventType.Neo4jCallbackOk:
                    state_2.state.searchResults = (_l = event.results) === null || _l === void 0 ? void 0 : _l.main.sort((a, b) => b.pagerank - a.pagerank);
                    state_2.state.metaSearchResults = (_m = event.results) === null || _m === void 0 ? void 0 : _m.meta;
                    state_2.state.waiting = false;
                    state_2.state.errorText = null;
                    break;
                case event_types_2.EventType.Neo4jCallbackFail:
                    state_2.state.searchResults = null;
                    state_2.state.waiting = false;
                    state_2.state.errorText = 'There was a problem querying the GovGraph. Please contact the Data Products team.';
                    console.log('neo4j-callback-fail:', event.error);
                    break;
                default:
                    console.log('unknown event type:', event);
            }
            updateUrl();
            (0, view_1.view)();
            // scroll to the top of the page when paginating
            if (event.id === 'button-next-page' || event.id === 'button-prev-page') {
                window.scrollTo(0, 0);
            }
        };
        exports.handleEvent = handleEvent;
        const searchButtonClicked = async function () {
            // update the state when the user clicked Search
            window.scrollTo(0, 0);
            state_2.state.errorText = null;
            state_2.state.userErrors = [];
            const searchStatus = (0, state_2.searchState)();
            switch (searchStatus.code) {
                case 'ready-to-search':
                    if (state_2.state.selectedWords !== '' || state_2.state.selectedLocale !== '' || state_2.state.selectedTaxon !== '' || state_2.state.linkSearchUrl !== '') {
                        state_2.state.waiting = true;
                        (0, neo4j_1.queryGraph)(state_2.state, handleEvent);
                    }
                    break;
                case 'error':
                    state_2.state.userErrors = searchStatus.errors;
                    break;
                case 'waiting':
                case 'initial':
                case 'no-results':
                case 'results':
                    break;
                default:
                    console.log('unknown value for searchState', (0, state_2.searchState)());
                    break;
            }
        };
        exports.searchButtonClicked = searchButtonClicked;
        const updateUrl = function () {
            if ('URLSearchParams' in window) {
                var searchParams = new URLSearchParams();
                if (state_2.state.searchType !== state_types_2.SearchType.Keyword)
                    searchParams.set('search-type', state_2.state.searchType);
                if (state_2.state.selectedWords !== '')
                    searchParams.set('selected-words', state_2.state.selectedWords);
                if (state_2.state.excludedWords !== '')
                    searchParams.set('excluded-words', state_2.state.excludedWords);
                if (state_2.state.selectedTaxon !== '')
                    searchParams.set('selected-taxon', state_2.state.selectedTaxon);
                if (state_2.state.selectedLocale !== '')
                    searchParams.set('lang', (0, lang_3.languageCode)(state_2.state.selectedLocale));
                if (state_2.state.caseSensitive)
                    searchParams.set('case-sensitive', state_2.state.caseSensitive.toString());
                if (state_2.state.whereToSearch.title)
                    searchParams.set('search-in-title', 'true');
                if (state_2.state.whereToSearch.text)
                    searchParams.set('search-in-text', 'true');
                if (state_2.state.areaToSearch !== state_types_2.SearchArea.Any)
                    searchParams.set('area', state_2.state.areaToSearch);
                if (state_2.state.combinator !== 'all')
                    searchParams.set('combinator', state_2.state.combinator);
                if (state_2.state.linkSearchUrl !== '')
                    searchParams.set('link-search-url', state_2.state.linkSearchUrl);
                let newRelativePathQuery = window.location.pathname;
                if (searchParams.toString().length > 0) {
                    newRelativePathQuery += '?' + searchParams.toString();
                }
                history.pushState(null, '', newRelativePathQuery);
            }
        };
    });
    define("view/view-components", ["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.viewMetaLink = exports.viewFeedbackBanner = void 0;
        const viewFeedbackBanner = function () {
            return `
        <div class="govuk-grid-row feedback-banner">
          <div class="feedback-banner-rule"></div>
          <div class="govuk-grid-column-two-thirds">
            <h2 class="govuk-heading-xl">Help us improve GovGraph</h2>
            <p class="govuk-body">
              Hello, we want to understand how you use Govgraph app to make sure it works well for you and we’d love your feedback. You can tell us about your experience of using the app by completing this short questionnaire. It will take about 5 minutes and most questions are multiple choice.
            </p>
            <p class="govuk-body">
              <a class="govuk-button" href="https://surveys.publishing.service.gov.uk/s/WUKRCT/">View questionnaire</a>
              <button id="dismiss-feedback-banner">Hide this</button>
            </p>
          </div>
        </div>`;
        };
        exports.viewFeedbackBanner = viewFeedbackBanner;
        const viewMetaLink = (text) => `<a class="govuk-link" href="/?selected-words=${encodeURIComponent(`"${text}"`)}">${text}</a>`;
        exports.viewMetaLink = viewMetaLink;
    });
    define("view/view-metabox", ["require", "exports", "state", "view/view-components"], function (require, exports, state_3, view_components_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.viewMetaResults = void 0;
        const viewOrgChild = (subOrg) => `<li>${(0, view_components_1.viewMetaLink)(subOrg)}</li>`;
        const viewOrgChildren = (childOrgNames) => `<details class="govuk-details">
         <summary class="govuk-details__summary">
           <span class="govuk-details__summary-text">
             ${childOrgNames.length} sub-organisations
           </span>
         </summary>
         <div class="govuk-details__text">
           <ul class="govuk-list govuk-list--bullet">${childOrgNames.map(viewOrgChild).join('')}</ul>
         </div>
       </details>`;
        const viewBankHolidayDetails = function (holiday) {
            return `
        <details class="govuk-details">
          <summary class="govuk-details__summary">
            <span class="govuk-details__summary-text">
              Dates
            </span>
          </summary>
          <div class="govuk-details__text">
            <ul class="govuk-list govuk-list--bullet">
              ${holiday.dates.map((date) => `<li>${date.dateString}</li>`).join('')}
            </ul>
          </div>
        </details>
        <details class="govuk-details">
          <summary class="govuk-details__summary">
            <span class="govuk-details__summary-text">
              Observed in
            </span>
          </summary>
          <div class="govuk-details__text">
            <ul class="govuk-list govuk-list--bullet">
              ${holiday.regions.map((region) => `<li>${region}</li>`).join('')}
            </ul>
          </div>
        </details>
      `;
        };
        const viewBankHoliday = (record) => `<div class="meta-results-panel">
         <h2 class="govuk-heading-m">
           ${record.name}
         </h2>
         <p class="govuk-body">Bank holiday</p>
         ${viewBankHolidayDetails(record)}
         </div>
      `;
        const viewOrg = (record) => `<div class="meta-results-panel">
         <h2 class="govuk-heading-m">
           <a class="govuk-link" href="${record.homepage}">${record.name}</a>
         </h2>
         <p class="govuk-body">
           Government organisation${record.parentName ? `, part of ${(0, view_components_1.viewMetaLink)(record.parentName)}` : ''}
         </p>
         ${record.description ? `<p class="govuk-body">${record.description}</p>` : ''}
         ${record.childOrgNames && record.childOrgNames.length > 0 ?
            viewOrgChildren(record.childOrgNames) :
            '<p class="govuk-body">No sub-organisations</p>'}
       </div>`;
        //=================== public ====================
        const viewMetaResultsExpandToggle = () => state_3.state.metaSearchResults && state_3.state.metaSearchResults.length > 5 ?
            `<button id="meta-results-expand">${state_3.state.disamboxExpanded ? 'show less' : 'show more'}</button>` :
            '';
        const viewMetaResults = function () {
            if (!state_3.state.metaSearchResults)
                return;
            if (state_3.state.metaSearchResults.length > 1) {
                const expandedClass = state_3.state.metaSearchResults.length > 5 && !state_3.state.disamboxExpanded ? 'meta-results-panel--collapsed' : '';
                return `
          <div class="meta-results-panel">
            <div class="meta-results-panel__collapsible ${expandedClass}">
              <h2 class="govuk-heading-s">"${state_3.state.selectedWords.replace(/"/g, '')}" can refer to:</h2>
              <ul class="govuk-list govuk-list--bullet">
                ${state_3.state.metaSearchResults.map(result => `<li>${(0, view_components_1.viewMetaLink)(result.name)} (${result.type.toLowerCase()})</li>`).join('')}
              </ul>
            </div>
            ${viewMetaResultsExpandToggle()}
          </div>
        `;
            }
            else {
                const record = state_3.state.metaSearchResults[0];
                console.log(`meta: found a ${record.type}`);
                switch (record.type) {
                    case "BankHoliday": return viewBankHoliday(record);
                    case "Organisation": return viewOrg(record);
                    default:
                        console.log(`unknown record type: ${record.type}`);
                        return ``;
                }
            }
        };
        exports.viewMetaResults = viewMetaResults;
    });
    define("view/view-search-panel", ["require", "exports", "utils", "state", "lang", "state-types"], function (require, exports, utils_3, state_4, lang_4, state_types_3) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.viewSearchPanel = void 0;
        const viewSearchPanel = () => {
            const result = [];
            switch (state_4.state.searchType) {
                case state_types_3.SearchType.Mixed:
                case state_types_3.SearchType.Results:
                    result.push(`
          <form id="search-form" class="search-panel govuk-form">
            <div class="search-mode-panel">
              <h1 class="govuk-heading-xl">Mixed search</h1>
              ${viewKeywordsInput()}
              ${viewKeywordsCombinator()}
              ${viewExclusionsInput()}
              ${viewCaseSensitiveSelector()}
              ${viewScopeSelector()}
              ${viewLinkSearch()}
              ${viewPublishingAppSelector()}
              ${viewTaxonSelector()}
              ${viewLocaleSelector()}
              ${viewSearchButton()}
            </div>
          </form>
        `);
                    break;
                case state_types_3.SearchType.Keyword:
                    result.push(`
          <form id="search-form" class="search-panel govuk-form">
            <div class="search-mode-panel">
              <a class="govuk-skip-link" href="#results-table">Skip to results</a>
              ${viewKeywordsInput()}
              <details class="govuk-details" data-module="govuk-details">
                <summary class="govuk-details__summary">
                  <span class="govuk-details__summary-text">
                    Filters
                  </span>
                </summary>
                <div class="govuk-details__text">
                  ${viewKeywordsCombinator()}
                  ${viewExclusionsInput()}
                  ${viewCaseSensitiveSelector()}
                  ${viewScopeSelector()}
                  ${viewPublishingAppSelector()}
                </div>
              </details>
              ${viewSearchButton()}
            </div>
          </form>
        `);
                    break;
                case state_types_3.SearchType.Link:
                    result.push(`
          <form id="search-form" class="search-panel govuk-form">
            <div class="search-mode-panel">
              <a class="govuk-skip-link" href="#results-table">Skip to results</a>
              ${viewLinkSearch()}
              <details class="govuk-details" data-module="govuk-details">
                <summary class="govuk-details__summary">
                  <span class="govuk-details__summary-text">
                    Filters
                  </span>
                </summary>
                <div class="govuk-details__text">
                  ${viewPublishingAppSelector()}
                </div>
              </details>
              ${viewSearchButton()}
            </div>
          </form>
        `);
                    break;
                case state_types_3.SearchType.Taxon:
                    result.push(`
          <form id="search-form" class="search-panel govuk-form">
            <div class="search-mode-panel">
              <a class="govuk-skip-link" href="#results-table">Skip to results</a>
              ${viewTaxonSelector()}
              <details class="govuk-details" data-module="govuk-details">
                <summary class="govuk-details__summary">
                  <span class="govuk-details__summary-text">
                    Filters
                  </span>
                </summary>
                <div class="govuk-details__text">
                  ${viewPublishingAppSelector()}
                </div>
              </details>
              ${viewSearchButton()}
            </div>
          </form>
        `);
                    break;
                case state_types_3.SearchType.Language:
                    result.push(`
          <form id="search-form" class="search-panel govuk-form">
            <div class="search-mode-panel">
              <a class="govuk-skip-link" href="#results-table">Skip to results</a>
              ${viewLocaleSelector()}
              <details class="govuk-details" data-module="govuk-details">
                <summary class="govuk-details__summary">
                  <span class="govuk-details__summary-text">
                    Filters
                  </span>
                </summary>
                <div class="govuk-details__text">
                  ${viewPublishingAppSelector()}
                </div>
              </details>
              ${viewSearchButton()}
            </div>
          </form>
        `);
                    break;
                default:
                    console.log('viewSearchPanel: unknown value', state_4.state.searchType);
            }
            result.push(`
        <p class="govuk-body-s">
          Runs only between 9am and 7pm.
          Searches do not include history mode content, Mainstream GitHub smart answers or service domains.
          Popularity scores depend on cookie consent.
        </p>
      `);
            return result.join('');
        };
        exports.viewSearchPanel = viewSearchPanel;
        const viewInlineError = (id, message) => `
      <p id="${id}" class="govuk-error-message">
        <span class="govuk-visually-hidden">Error:</span> ${message}
      </p>
    `;
        const viewScopeSelector = () => {
            var _a;
            const errors = (_a = (0, state_4.searchState)()) === null || _a === void 0 ? void 0 : _a.errors;
            const err = errors && errors.includes('missingWhereToSearch');
            return `
      <div class="govuk-form-group ${err ? 'govuk-form-group--error' : ''}">
        <fieldset
            class="govuk-fieldset"
            ${state_4.state.waiting && 'disabled="disabled"'}
            id="search-scope-wrapper"
            ${err ? 'aria-describedby="scope-error"' : ''}>
          <legend class="govuk-fieldset__legend">
            Keyword location
          </legend>
          ${err ? viewInlineError('scope-error', 'Please choose at least one option') : ''}
          <div class="govuk-checkboxes" id="search-locations">
            <div class="govuk-checkboxes__item">
              <input
                  class="govuk-checkboxes__input"
                  type="checkbox" id="search-title"
                  ${state_4.state.whereToSearch.title ? 'checked' : ''}/>
              <label for="search-title" class="govuk-label govuk-checkboxes__label">title</label>
            </div>
            <div class="govuk-checkboxes__item">
              <input
                  class="govuk-checkboxes__input"
                  type="checkbox"
                  id="search-text"
                ${state_4.state.whereToSearch.text ? 'checked' : ''}/>
              <label for="search-text" class="govuk-label govuk-checkboxes__label">
                body content and description
              </label>
            </div>
          </div>
        </fieldset>
      </div>
      `;
        };
        const viewTaxonSelector = () => `
      <div class="govuk-body">
        <div class="taxon-facet">
          <label class="govuk-label label--bold" for="taxon">
            Search for taxons
          </label>
          <div class="govuk-hint">
            Type the first letters of a taxon or select from the dropdown
          </div>
          <datalist id="taxonList">
            ${state_4.state.taxons.map(taxon => `<option>${taxon}</option>`)}
          </datalist>
          <div>
          <input
            ${state_4.state.waiting && 'disabled="disabled"'}
            style="display: inline-block"
            list="taxonList"
            value="${state_4.state.selectedTaxon}"
            class="govuk-input"
            id="taxon"
            autocomplete="off" />
          </div>
        </div>
      </div>
    `;
        const viewLocaleSelector = () => {
            const html = [`
        <div class="govuk-body taxon-facet">
          <label class="govuk-label label--bold" for="locale">
            Search for languages
          </label>
          <div class="govuk-hint">
            Type the first letters of a language or select from the dropdown
          </div>
          <datalist id="localeList">
      `];
            html.push(...state_4.state.locales.map(code => `<option data-value="${code}" ${state_4.state.selectedLocale == code ? 'selected' : ''}>${(0, lang_4.languageName)(code)}</option>`));
            html.push(`
          </datalist>
          <input type="text"
             ${state_4.state.waiting && 'disabled="disabled"'}
             value="${state_4.state.selectedLocale}"
             class="govuk-input"
             list="localeList"
             id="locale" name="locale"
             autocomplete="off" />
        </div>`);
            return html.join('');
        };
        const viewSearchButton = () => `
      <p class="govuk-body">
        <button
          type="submit"
          class="govuk-button ${state_4.state.waiting ? 'govuk-button--disabled' : ''}"
          ${state_4.state.waiting ? 'disabled="disabled"' : ''}
          id="search">
          ${state_4.state.waiting ? 'Searching <img src="assets/images/loader.gif" height="20px" alt="loader"/>' : 'Search'}
        </button>
      </p>
    `;
        const viewLinkSearch = () => `
      <div class="govuk-body">
        <label class="govuk-label label--bold" for="link-search">
          Search for links
        </label>
        <div class="govuk-hint">
          For example: /maternity-pay-leave or youtube.com
        </div>
        <input
            class="govuk-input"
            id="link-search"
            ${state_4.state.waiting && 'disabled="disabled"'}
            value="${state_4.state.linkSearchUrl}"
         />
      </div>
    `;
        const viewCaseSensitiveSelector = () => `
      <div class="govuk-body">
        <div class="govuk-checkboxes">
          <div class="govuk-checkboxes__item">
            <input
                class="govuk-checkboxes__input"
                ${state_4.state.waiting && 'disabled="disabled"'}
                type="checkbox"
                id="case-sensitive"
                ${state_4.state.caseSensitive ? 'checked' : ''}
            />
            <label for="case-sensitive" class="govuk-label govuk-checkboxes__label">case-sensitive search</label>
          </div>
        </div>
      </div>
    `;
        const viewKeywordsCombinator = () => ` <div class="govuk-form-group">
        <fieldset
            class="govuk-fieldset"
            id="combinator-wrapper"
            ${state_4.state.waiting && 'disabled="disabled"'}>
    
          <legend class="govuk-fieldset__legend">
            Search for
          </legend>
          <div class="govuk-radios" id="combinators">
            <div class="govuk-radios__item">
              <input class="govuk-radios__input"
                     type="radio" id="combinator-any"
                     name="combinator"
                ${state_4.state.combinator === 'any' ? 'checked' : ''}/>
              <label for="combinator-any" class="govuk-label govuk-radios__label">
                any keyword
              </label>
            </div>
            <div class="govuk-radios__item">
              <input class="govuk-radios__input"
                     type="radio" id="combinator-all"
                     name="combinator"
                ${state_4.state.combinator === 'all' ? 'checked' : ''}/>
              <label for="combinator-all" class="govuk-label govuk-radios__label">
                all keywords
              </label>
            </div>
          </div>
        </fieldset>
      </div>
    `;
        const viewPublishingAppSelector = () => ` <div class="govuk-form-group">
        <fieldset
            class="govuk-fieldset"
            id="search-areas-wrapper"
            ${state_4.state.waiting && 'disabled="disabled"'}>
          <legend class="govuk-fieldset__legend">
            Limit search
          </legend>
          <div class="govuk-radios" id="site-areas">
            <div class="govuk-radios__item">
              <input class="govuk-radios__input"
                     type="radio" id="area-mainstream"
                     name="area"
                ${state_4.state.areaToSearch === 'mainstream' ? 'checked' : ''}/>
              <label for="area-mainstream" class="govuk-label govuk-radios__label">
                Mainstream Publisher
              </label>
            </div>
            <div class="govuk-radios__item">
              <input class="govuk-radios__input"
                     type="radio" id="area-whitehall"
                     name="area"
                ${state_4.state.areaToSearch === 'whitehall' ? 'checked' : ''}/>
              <label for="area-whitehall" class="govuk-label govuk-radios__label">Whitehall</label>
            </div>
            <div class="govuk-radios__item">
              <input class="govuk-radios__input"
                     type="radio" id="area-any"
                     name="area"
                ${state_4.state.areaToSearch === 'any' ? 'checked' : ''}/>
              <label for="area-any" class="govuk-label govuk-radios__label">All publishing applications</label>
            </div>
          </div>
        </fieldset>
      </div>
    `;
        const viewKeywordsInput = () => `
      <div class="govuk-body">
        <label for="keyword" class="govuk-label label--bold">Search for keywords</label>
        <div class="govuk-hint">
          For example: cat, dog, &quot;Department for Education&quot;
        </div>
        <input
          ${state_4.state.waiting && 'disabled="disabled"'}
          class="govuk-input"
          id="keyword"
          value='${(0, utils_3.sanitiseOutput)(state_4.state.selectedWords)}'
        />
      </div>
    `;
        const viewExclusionsInput = () => `
      <div class="govuk-body">
        <label for="excluded-keyword" class="govuk-label label--bold">
          Exclude keywords
        </label>
        <div class="govuk-hint">
          For example: passport
        </div>
        <input class="govuk-input"
            ${state_4.state.waiting && 'disabled="disabled"'}
            id="excluded-keyword"
            value='${(0, utils_3.sanitiseOutput)(state_4.state.excludedWords).replace('"', '&quot;')}'/>
      </div>
    `;
    });
    define("view/view", ["require", "exports", "utils", "state", "events", "lang", "view/view-metabox", "view/view-search-panel", "view/view-components", "event-types"], function (require, exports, utils_4, state_5, events_1, lang_5, view_metabox_1, view_search_panel_1, view_components_2, event_types_3) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.view = void 0;
        const view = () => {
            var _a, _b, _c;
            console.log('view');
            document.title = 'GovGraph search';
            const pageContent = (0, utils_4.id)('page-content');
            if (pageContent) {
                pageContent.innerHTML = `
          <main class="govuk-main-wrapper" id="main-content" role="main">
            ${state_5.state.displayFeedbackBanner ? (0, view_components_2.viewFeedbackBanner)() : ''}
            ${viewErrorBanner()}
            ${viewSearchTypeSelector()}
            ${viewMainLayout()}
          </main>
        `;
            }
            // Add event handlers
            document.querySelectorAll('#dismiss-feedback-banner, button, input[type=checkbox][data-interactive=true]')
                .forEach(input => input.addEventListener('click', event => (0, events_1.handleEvent)({ type: event_types_3.EventType.Dom, id: event.target.getAttribute('id') || undefined })));
            // Not sure this is even fired, since browser blocks submit because "the form is not connected"
            (_a = (0, utils_4.id)('search-form')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', event => {
                event.preventDefault();
                // Tell GTM the form was submitted
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'formSubmission',
                    'formType': 'Search',
                    'formPosition': 'Page'
                });
                (0, events_1.handleEvent)({ type: event_types_3.EventType.Dom, id: 'search' });
            });
            (_b = (0, utils_4.id)('meta-results-expand')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => (0, events_1.handleEvent)({ type: event_types_3.EventType.Dom, id: 'toggleDisamBox' }));
            // focus on the results heading if present
            (_c = (0, utils_4.id)('results-heading')) === null || _c === void 0 ? void 0 : _c.focus();
        };
        exports.view = view;
        const viewSearchTypeSelector = () => `
        <p class="govuk-body search-selector">
          Search for:
          <button class="${state_5.state.searchType === 'keyword' ? 'active' : ''}" id="search-keyword">Keywords</button>
          <button class="${state_5.state.searchType === 'link' ? 'active' : ''}" id="search-link">Links</button>
          <button class="${state_5.state.searchType === 'taxon' ? 'active' : ''}" id="search-taxon">Taxons</button>
          <button class="${state_5.state.searchType === 'language' ? 'active' : ''}" id="search-language">Languages</button>
          <button class="${state_5.state.searchType === 'mixed' ? 'active' : ''}" id="search-mixed">Mixed</button>
        </p>
      `;
        const viewMainLayout = () => {
            const result = [];
            if (state_5.state.searchType === 'mixed') {
                if (!state_5.state.searchResults) {
                    result.push(`
            <div class="govuk-grid-row mixed-layout--no-results">
              <div class="govuk-grid-column-two-thirds">
                ${(0, view_search_panel_1.viewSearchPanel)()}
              </div>
            </div>
          `);
                }
                else {
                    result.push(`
            <div class="govuk-grid-row mixed-layout">
              <div class="govuk-grid-column-one-third">
                ${(0, view_search_panel_1.viewSearchPanel)()}
              </div>
              <div class="govuk-grid-column-two-thirds">
                ${viewSearchResults()}
              </div>
            </div>
          `);
                }
            }
            else {
                result.push(`
          <div class="govuk-grid-row simple-search">
            <div class="govuk-grid-column-two-thirds">
              ${(0, view_search_panel_1.viewSearchPanel)()}
            </div>
          </div>
          ${viewSearchResults()}
        `);
            }
            return result.join('');
        };
        const makeBold = (text, includeMarkup) => includeMarkup ?
            `<span class="govuk-!-font-weight-bold">${text}</span>` :
            `"${text}"`;
        const viewContainDescription = (includeMarkup) => {
            let where;
            if (state_5.state.whereToSearch.title && state_5.state.whereToSearch.text) {
                where = '';
            }
            else if (state_5.state.whereToSearch.title) {
                where = 'in their title';
            }
            else {
                where = 'in their body content';
            }
            let combineOp = state_5.state.combinator === 'all' ? 'and' : 'or';
            let combinedWords = (0, utils_4.splitKeywords)(state_5.state.selectedWords)
                .filter(w => w.length > 2)
                .map(w => makeBold(w, includeMarkup))
                .join(` ${combineOp} `);
            return state_5.state.selectedWords !== '' ? `${combinedWords} ${where}` : '';
        };
        const viewQueryDescription = (includeMarkup = true) => {
            const clauses = [];
            if (state_5.state.selectedWords !== '') {
                let keywords = `contain ${viewContainDescription(includeMarkup)}`;
                if (state_5.state.excludedWords !== '') {
                    keywords = `${keywords} (but don't contain ${makeBold(state_5.state.excludedWords, includeMarkup)})`;
                }
                clauses.push(keywords);
            }
            if (state_5.state.selectedTaxon !== '')
                clauses.push(`belong to the ${makeBold(state_5.state.selectedTaxon, includeMarkup)} taxon (or its sub-taxons)`);
            if (state_5.state.selectedLocale !== '')
                clauses.push(`are in ${makeBold((0, lang_5.languageName)(state_5.state.selectedLocale), includeMarkup)}`);
            if (state_5.state.linkSearchUrl !== '')
                clauses.push(`link to ${makeBold(state_5.state.linkSearchUrl, includeMarkup)}`);
            if (state_5.state.areaToSearch === 'whitehall' || state_5.state.areaToSearch === 'mainstream')
                clauses.push(`are published using ${makeBold(state_5.state.areaToSearch, includeMarkup)}`);
            const joinedClauses = (clauses.length === 1) ?
                clauses[0] :
                `${clauses.slice(0, clauses.length - 1).join(', ')} and ${clauses[clauses.length - 1]}`;
            return `pages that ${joinedClauses}`;
        };
        const viewErrorBanner = () => {
            const html = [];
            if (state_5.state.errorText || state_5.state.userErrors.length > 0) {
                html.push(`
            <div class="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabindex="-1" data-module="govuk-error-summary">`);
                if (state_5.state.errorText) {
                    html.push(`
              <h1 class="govuk-error-summary__title" id="error-summary-title">System error</h1>
              <p class="govuk-body">${state_5.state.errorText}</p>
            `);
                }
                else {
                    if (state_5.state.userErrors.length > 0) {
                        html.push(`
                <h1 class="govuk-error-summary__title" id="error-summary-title">
                  There is a problem
                </h1>
                <ul class="govuk-error-summary__list">
              `);
                        state_5.state.userErrors.forEach(userError => {
                            switch (userError) {
                                case 'missingWhereToSearch':
                                    html.push(`
                  <li><a href="#search-locations-wrapper">You need to select a keyword location</a></li>`);
                                    break;
                                case 'missingArea':
                                    html.push(`
                  <li><a href="#search-scope-wrapper">You need to select a publishing application</a></li>`);
                                    break;
                                default:
                                    console.log('unknown user error code:', userError);
                            }
                        });
                        html.push(`
                </ul>`);
                    }
                }
                html.push(`
            </div>
          `);
            }
            return html.join('');
        };
        const viewSearchResultsTable = () => {
            var _a, _b;
            const html = [];
            if (state_5.state.searchResults && ((_a = state_5.state.searchResults) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                const recordsToShow = (_b = state_5.state.searchResults) === null || _b === void 0 ? void 0 : _b.slice(state_5.state.skip, state_5.state.skip + state_5.state.resultsPerPage);
                html.push(`
          <div class="govuk-body">
            <fieldset class="govuk-fieldset" ${state_5.state.waiting && 'disabled="disabled"'}>
              <legend class="govuk-fieldset__legend">For each result, display:</legend>
              <ul class="kg-checkboxes" id="show-fields">`);
                html.push(Object.keys(state_5.state.searchResults[0]).map(key => `
                <li class="kg-checkboxes__item">
                  <input class="kg-checkboxes__input"
                         data-interactive="true"
                         type="checkbox" id="show-field-${key}"
                    ${state_5.state.showFields[key] ? 'checked' : ''}/>
                  <label for="show-field-${key}" class="kg-label kg-checkboxes__label">${fieldName(key)}</label>
                </li>`).join(''));
                html.push(`
              </ul>
            </fieldset>
            <table id="results-table" class="govuk-table">
              <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <th scope="col" class="a11y-hidden">Page</th>`);
                Object.keys(state_5.state.showFields).forEach(key => {
                    if (state_5.state.showFields[key]) {
                        html.push(`<th scope="col" class="govuk-table__header">${fieldName(key)}</th>`);
                    }
                });
                recordsToShow.forEach((record, recordIndex) => {
                    html.push(`
            <tr class="govuk-table__row">
              <th class="a11y-hidden">${recordIndex}</th>`);
                    Object.keys(state_5.state.showFields).forEach(key => {
                        if (state_5.state.showFields[key]) {
                            html.push(`<td class="govuk-table__cell">${fieldFormat(key, record[key])}</td>`);
                        }
                    });
                    html.push(`</tr>`);
                });
                html.push(`
              </tbody>
            </table>
          </div>`);
                return html.join('');
            }
            else {
                return '';
            }
        };
        const csvFromResults = function (searchResults) {
            const csv = [];
            if (searchResults && searchResults.length > 0) {
                // column headings: take them from the first record
                csv.push(Object.keys(searchResults[0]).map(fieldName).join());
                // rows:
                searchResults.forEach((record) => {
                    const line = [];
                    Object.values(record).forEach((field) => {
                        if (field) {
                            field = field.toString();
                            if (field.includes(',')) {
                                field = `"${field.replace('"', '""')}"`;
                            }
                            else {
                                if (field.includes('"')) {
                                    field = '"' + field.replace('"', '""') + '"';
                                }
                            }
                        }
                        else {
                            field = '';
                        }
                        line.push(field);
                    });
                    csv.push(line.join());
                });
            }
            return csv.join('\n');
        };
        const viewWaiting = () => `
      <div class="govuk-body">Searching for ${viewQueryDescription()}</div>
      <p class="govuk-body-s">Some queries may take up to a minute</p>
    `;
        const viewResults = function () {
            if (state_5.state.searchResults) {
                const html = [];
                const nbRecords = state_5.state.searchResults.length;
                if (nbRecords < state_5.state.nbResultsLimit) {
                    html.push(`
            <h1 tabindex="0" id="results-heading" class="govuk-heading-l">${nbRecords} result${nbRecords !== 0 ? 's' : ''}</h1>`);
                }
                else {
                    html.push(`
            <div class="govuk-warning-text">
              <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
              <strong class="govuk-warning-text__text">
                <span class="govuk-warning-text__assistive">Warning</span>
                There are more than ${state_5.state.nbResultsLimit} results. Try to narrow down your search.
              </strong>
            </div>
          `);
                }
                html.push(`<div class="govuk-body">for ${viewQueryDescription()}</div>`);
                if (nbRecords >= state_5.state.resultsPerPage) {
                    html.push(`
            <p class="govuk-body">Showing results ${state_5.state.skip + 1} to ${Math.min(nbRecords, state_5.state.skip + state_5.state.resultsPerPage)}, in descending popularity</p>
            <a class="govuk-skip-link" href="#results-table">Skip to results</a>
            <a class="govuk-skip-link" href="#search-form">Back to search filters</a>
      `);
                }
                html.push(viewSearchResultsTable());
                if (nbRecords >= state_5.state.resultsPerPage) {
                    html.push(`
            <p class="govuk-body">
              <button type="button" class="govuk-button" id="button-prev-page">Previous</button>
              <button type="button" class="govuk-button" id="button-next-page">Next</button>
            </p>`);
                }
                const csv = csvFromResults(state_5.state.searchResults);
                const file = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(file); // TODO: use window.URL.revokeObjectURL(url);  after
                html.push(`
            <p class="govuk-body"><a class="govuk-link" href="${url}" download="export.csv">Download all ${state_5.state.searchResults.length} records in CSV</a></p>`);
                return html.join('');
            }
            else {
                return '';
            }
        };
        const viewNoResults = () => {
            return `
        <h1 tabindex="0" id="results-heading" class="govuk-heading-l">No results</h1>
        <div class="govuk-body">for ${viewQueryDescription()}</div>
      `;
        };
        const viewSearchResults = () => {
            switch ((0, state_5.searchState)().code) {
                case 'waiting':
                    document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;
                    return viewWaiting();
                case 'results':
                    document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;
                    return `${(0, view_metabox_1.viewMetaResults)() || ''} ${viewResults()}`; // FIXME - avoid || ''
                case 'no-results':
                    document.title = `GOV.UK ${viewQueryDescription(false)} - GovGraph search`;
                    return `${(0, view_metabox_1.viewMetaResults)() || ''} ${viewNoResults()}`; // FIXME - avoid || ''
                default:
                    document.title = 'GovGraph search';
                    return '';
            }
        };
        // Remove duplicates - but should be fixed in cypher
        const formatNames = (array) => [...new Set(array)].map(x => `"${x}"`).join(', ');
        const formatDateTime = (date) => `${date.slice(0, 10)} at ${date.slice(12, 16)}`;
        const fieldFormatters = {
            'url': {
                name: 'URL',
                format: (url) => `<a class="govuk-link" href="${url}">${url}</a>`
            },
            'title': { name: 'Title' },
            'locale': { name: 'Language', format: lang_5.languageName },
            'documentType': { name: 'Document type' },
            'publishing_app': { name: 'Publishing app' },
            'first_published_at': {
                name: 'First published',
                format: formatDateTime
            },
            'public_updated_at': {
                name: 'Last major update',
                format: formatDateTime,
            },
            'taxons': {
                name: 'Taxons',
                format: formatNames
            },
            'primary_organisation': {
                name: 'Primary publishing organisations',
                format: formatNames
            },
            'all_organisations': {
                name: 'All publishing organisations',
                format: formatNames
            },
            'pagerank': {
                name: 'Popularity',
                format: (val) => val ? val.toFixed(2) : 'n/a'
            },
            'withdrawn_at': {
                name: 'Withdrawn at',
                format: (date) => date ? formatDateTime(date) : "not withdrawn"
            },
            'withdrawn_explanation': {
                name: 'Withdrawn reason',
                format: (text) => text || 'n/a'
            }
        };
        const fieldName = function (key) {
            const f = fieldFormatters[key];
            return f ? f.name : key;
        };
        const fieldFormat = function (key, val) {
            const f = fieldFormatters[key];
            return (f && f.format) ? f.format(val) : val;
        };
    });
    define("main", ["require", "exports", "view/view", "state", "events", "neo4j"], function (require, exports, view_2, state_6, events_2, neo4j_2) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        //==================================================
        // INIT
        //==================================================
        const init = async function () {
            // decide if we're showing the feedback banner
            state_6.state.displayFeedbackBanner = !document.cookie.includes('feedback_banner_dismissed=true');
            state_6.state.errorText = null;
            try {
                await (0, neo4j_2.initNeo4j)();
            }
            catch (e) {
                console.log('Failed to connect to the GovGraph', e);
                state_6.state.errorText = `Error connecting to the GovGraph.<br/></br/>
    Possible causes:<br/>
    <br/>
    - The GovGraph only runs on weekdays from 9am to 7pm<br/><br/>
    - There's a problem with GovGraph. Please contact the Data Products team.`;
                (0, state_6.resetSearch)();
                return;
            }
            window.addEventListener('popstate', () => {
                (0, state_6.setQueryParamsFromQS)();
                (0, view_2.view)();
            });
        };
        //==================================================
        // START
        //==================================================
        (async () => {
            await init();
            if (!state_6.state.errorText) {
                (0, state_6.setQueryParamsFromQS)();
                (0, events_2.searchButtonClicked)();
            }
            (0, view_2.view)();
        })();
    });
    
    'marker:resolver';

    function get_define(name) {
        if (defines[name]) {
            return defines[name];
        }
        else if (defines[name + '/index']) {
            return defines[name + '/index'];
        }
        else {
            const dependencies = ['exports'];
            const factory = (exports) => {
                try {
                    Object.defineProperty(exports, "__cjsModule", { value: true });
                    Object.defineProperty(exports, "default", { value: require(name) });
                }
                catch (_a) {
                    throw Error(['module "', name, '" not found.'].join(''));
                }
            };
            return { dependencies, factory };
        }
    }
    const instances = {};
    function resolve(name) {
        if (instances[name]) {
            return instances[name];
        }
        if (name === 'exports') {
            return {};
        }
        const define = get_define(name);
        if (typeof define.factory !== 'function') {
            return define.factory;
        }
        instances[name] = {};
        const dependencies = define.dependencies.map(name => resolve(name));
        define.factory(...dependencies);
        const exports = dependencies[define.dependencies.indexOf('exports')];
        instances[name] = (exports['__cjsModule']) ? exports.default : exports;
        return instances[name];
    }
    if (entry[0] !== null) {
        return resolve(entry[0]);
    }
})();