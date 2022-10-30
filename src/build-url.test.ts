import {buildUrl} from "./build-url";

/**
 * The expected api url for tests
 */
const API_TEST_URL = "https://test.api:8080/";

/**
 * The path used to test buildUrl
 */
const TEST_PATH = "my/test-path";

test("Build url without parameters", () => {
    expect(buildUrl("/")).toBe("/");
    expect(buildUrl(TEST_PATH)).toBe(TEST_PATH);
    expect(buildUrl("/" + TEST_PATH)).toBe("/" + TEST_PATH);
    expect(buildUrl(TEST_PATH + "/")).toBe(TEST_PATH);
    expect(buildUrl("///" + TEST_PATH + "///")).toBe("/" + TEST_PATH);
    expect(buildUrl("///my///test-path///")).toBe("/" + TEST_PATH);
});

test("Build url with parameters", () => {
    expect(buildUrl(TEST_PATH + "?my-word=toto&val[]=12&val[]=13&titi[]=1", {
        parameters: {
            toto: "titi",
            titi: [1, 2, 3],
        },
    })).toBe(TEST_PATH + "?toto=titi&titi[]=1&titi[]=2&titi[]=3&titi[]=1&my-word=toto&val[]=12&val[]=13");
});

test("Build url with placeholders", () => {
    expect(buildUrl([API_TEST_URL, "my/:id/test-path/:page"], {
        parameters: {
            id: 12,
            page: 1,
        },
    })).toBe(API_TEST_URL+"my/12/test-path/1");
});

test("Build url with unsafe parameters", () => {
    expect(buildUrl([API_TEST_URL, "my-url"], {
        parameters: {
            param: "text with spaces",
        },
    })).toBe(API_TEST_URL+"my-url?param=text%20with%20spaces");
});
