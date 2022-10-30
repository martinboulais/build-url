const URL_PARTS_SEPARATOR = "/";

const PROTOCOL_SEPARATOR = "://";

const PARAMETER_START_CHARACTER = "?";

const PARAMETER_KEY_VALUE_SEPARATOR = "=";

const PARAMETERS_SEPARATOR = "&";

const PARAMETER_ARRAY_KEY_SUFFIX = "[]";

type PathPart = string | number;

type ParameterValue = number | string | number[] | string[] | null | undefined;

type ParametersMap = { [key: string]: ParameterValue };


/**
 * Extract the parameters from an url and append them in an existing parameters map
 *
 * @param url the url from which parameters must be extracted
 * @param parameters the existing parameters to which url parameters must be concatenated
 */
function extractExistingParameters(url: string, parameters: ParametersMap) {
    // If there is already parameters in the URL, remove them
    let existingParametersSplit = url.split(PARAMETER_START_CHARACTER, 2);
    if (existingParametersSplit.length === 2) {
        url = existingParametersSplit[0];
        let parametersString = existingParametersSplit[1];
        for (let parameterExpression of parametersString.split(PARAMETERS_SEPARATOR)) {
            let [key, value] = parameterExpression.split(PARAMETER_KEY_VALUE_SEPARATOR);
            const isArray = key.endsWith(PARAMETER_ARRAY_KEY_SUFFIX);
            if (isArray) {
                key = key.substring(0, key.length - PARAMETER_ARRAY_KEY_SUFFIX.length);
                if (!(key in parameters)) {
                    parameters[key] = [value];
                } else if (Array.isArray(parameters[key])) {
                    // @ts-ignore
                    parameters[key].push(value);
                }
            } else if (!(key in parameters)) {
                parameters[key] = value;
            }
        }
    }
    return url;
}

/**
 * Clean and build a given path
 *
 * @param path
 * @param options
 */
export const buildUrl = (
    // The path (or path parts) to build
    path: PathPart | PathPart[],
    options?: {
        // The list of url parameters
        parameters?: ParametersMap
    },
) => {
    let pathParts;
    const parameters: ParametersMap = options?.parameters ?? {};

    if (Array.isArray(path)) {
        pathParts = path;
    } else {
        pathParts = [path];
    }

    if (pathParts.length === 0) {
        pathParts.push("");
    }

    // Remove the protocol part of the first URL path part
    // Or, if the url starts with a / do not remove it
    let protocol = null;
    let leadingSlash = null;
    const urlProtocolSplit = String(pathParts[0]).split(PROTOCOL_SEPARATOR, 2);
    if (urlProtocolSplit.length === 2) {
        [protocol, pathParts[0]] = urlProtocolSplit;
    } else if (String(pathParts[0]).charAt(0) === URL_PARTS_SEPARATOR)
    {
        leadingSlash = true;
    }

    /**
     * Replace a URL placeholder (such as :id) by its value if it is found in the parameters object
     *
     * @param pathPart the path part that may contain a placeholder
     */
    const replacePlaceholder = (pathPart: string): string => {
        const match = pathPart.match(/^:(\w+)$/);

        if (match) {
            const placeholderKey = match[1];
            if (placeholderKey in parameters) {
                const value = parameters[placeholderKey];
                if (!Array.isArray(value)) {
                    delete parameters[placeholderKey];
                    return String(value);
                }
            }
        }

        return pathPart;
    };

    let url = pathParts.reduce<string>((acc: string, value: PathPart) => {
        // Trim separators from start and end of the path part, and any supernumerary
        return acc + URL_PARTS_SEPARATOR
            + String(value)
                .split(URL_PARTS_SEPARATOR)
                .filter(subPathPart => !!subPathPart)
                .map(subPathPart => replacePlaceholder(subPathPart))
                .join(URL_PARTS_SEPARATOR);
    }, "").substring(1);

    url = extractExistingParameters(url, parameters);

    // Put back the protocol or the leading slash in the URL
    if (protocol) {
        url = protocol + PROTOCOL_SEPARATOR + url;
    } else if (leadingSlash) {
        url = URL_PARTS_SEPARATOR + url;
    }

    const parametersEntries = Object.entries(parameters);
    if (parametersEntries.length > 0) {
        url += PARAMETER_START_CHARACTER + parametersEntries.map(([key, value]) => {
            if (Array.isArray(value)) {
                return value.map(item => key + PARAMETER_ARRAY_KEY_SUFFIX + PARAMETER_KEY_VALUE_SEPARATOR + encodeURI(`${item}`))
                    .join(PARAMETERS_SEPARATOR);
            } else {
                return key + PARAMETER_KEY_VALUE_SEPARATOR + (encodeURI(`${value}`) ?? '');
            }
        }).join(PARAMETERS_SEPARATOR);
    }

    return url;
};
