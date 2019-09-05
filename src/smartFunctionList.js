const smartFunctions = {
    "inc": {
        "arguments": "n, optional",
        "examples": ["(inc)", "(inc 1)"],
        "doc": "Increment existing value by 1. Works on integer. If no argument, returns 1.",
        "context": ["all"],
        "seeAlso": ["dec"]
    },
    "dec":  {
        "arguments": "n, optional",
        "example": ["(dec)", "(dec 10)"],
        "doc": "Decrement existing value by 1. Works on integer. If no argument, returns -1.",
        "context": ["all"],
        "seeAlso": ["inc"]
    },
    "now":  {
        "arguments": "none",
        "example": ["(now)"],
        "doc": "Insert current server time. Works on instant.",
        "context": ["all"]
    },
    "==":   {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(== 1 1 1)", "(== 3 4)"],
        "doc": "Returns true if all items within the vector are equal. Works on integer, string, and boolean.",
        "context": ["all"],
        "seeAlso": [">=", ">", "<", "<="]
    },
    "+": {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(+ 10 19 1)", "(+ 3 4.09)"],
        "doc": "Returns the sum of the provided values. Works on integer and float.",
        "context": ["all"],
        "seeAlso": ["-", "*", "/"]
    },
    "-":  {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(- 10 19 1)", "(- 30 4.09)"],
        "doc": "Returns the difference of the numbers. The first, as the minuend, the rest as the subtrahends. Works on integer and float.",
        "context": ["all"],
        "seeAlso": ["+", "*", "/"]
    },
    "*":    {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(* 10 19 1)", "(* 30 4.09)"],
        "doc": "Returns the product of the provided values. Works on integer and float.",
        "context": ["all"],
        "seeAlso": ["-", "+", "/"]
    },
    "/":    {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(/ 10 19 1)", "(/ 30 4.09)"],
        "doc": "If only one argument supplied, returns 1/first argument, else returns first argument divided by all of the other arguments. Works on integer and float.",
        "context": ["all"],
        "seeAlso": ["-", "+", "+"]
    },
    ">":    {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(> 10 19 1)", "(> 30 4.09)"],
        "doc": "Returns true if values are in monotonically decreasing order.",
        "context": ["all"],
        "seeAlso": [">=", "==", "<", "<="]
    },
    ">=":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(>= 10 19 19)", "(>= 30 4.09)"],
        "doc": "Returns true if values are in monotonically non-increasing order.",
        "context": ["all"],
        "seeAlso": [">", "==", "<", "<="]
    },
    "<": {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(< 10 19 1)", "(< 30 4.09)"],
        "doc": "Returns true if values are in monotonically increasing order.",
        "context": ["all"]
    },
    "<=":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(<= 10 19 19)", "(<= 30 4.09)"],
        "doc": "Returns true if values are in monotonically non-decreasing order.",
        "context": ["all"]
    },
    "quot":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(quot 60 10)", "(quot 30 4.09)"],
        "doc": "Returns the quotient of dividing the first argument by the second argument. Rounds the answer towards 0 to return the nearest integer. Works on integer and float.",
        "context": ["all"]
    },
    "rem":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(rem 60 10)", "(rem 30 4.09)"],
        "doc": "Remainder of dividing the first argument by the second argument. Works on integer and float.",
        "context": ["all"]
    },
    "mod":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(mod 60 10)", "(mod 30 4.09)"],
        "doc": "Modulus of the first argument divided by the second argument. The mod function takes the rem of the two arguments, and if the either the numerator or denominator are negative, it adds the denominator to the remainder, and returns that value. Works on integer and float.",
        "context": ["all"]
    },
    "max":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(max 60 10)", "(mod 30 4.09)"],
        "doc": "Returns the max of the provided values. Works on integer, float.",
        "context": ["all"]
    },
    "min":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(min 60 10)", "(min 30 4.09)"],
        "doc": "Returns the min of the provided values. Works on integer, float.",
        "context": ["all"]
    },
    "max-pred-val":    {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(max-pred-val \"person/age\")"],
        "doc": "Returns the max of the provided predicate. Works on integer, float",
        "context": ["all"]
    },
    "str":     {
        "arguments": "arg1, arg2, arg3...",
        "example": ["(str \"flur\" \".ee\")"],
        "doc": "Concatenates all strings in the vector. Works on integer, string, float, and boolean.",
        "context": ["all"]
    },
    "if-else":    {
        "arguments": "test true false",
        "example": ["(if-else (== 1 2) \"You were right!\" \"Boo!\")"],
        "doc": "Takes a test as a first argument. If the test succeeds, return the second argument, else return the third argument.",
        "context": ["all"]
    },
    "and":     {
        "arguments": "arg1 arg2 ...",
        "example": ["(and (== 1 1) (== 2 2)"],
        "doc": "Returns true if all objects within the vector are non-nil and non-false, else returns false.",
        "context": ["all"]
    },
    "or":  {
        "arguments": "arg1 arg2 ...",
        "example": ["(or (== 1 1) (== 2 2)"],
        "doc": "Returns true if any of the objects within the vector are non-nil and non-false, else returns false.",
        "context": ["all"]
    },
    "boolean":  {
        "arguments": "x",
        "example": ["(boolean 1)", "(boolean \"apple\")"],
        "doc": "Coerces any non-nil and non-false value to true, else returns false.",
        "context": ["all"]
    },
    "nil?": {
        "arguments": "x",
        "example": ["(nil? 1)", "(nil? \"apple\")"],
        "doc": "If nil, returns true, else returns false.",
        "context": ["all"]
    },
    "count":  {
        "arguments": "[s] or string",
        "example": ["(count [1 2 3])", "(count \"here's some words\")"],
        "doc": "If nil, returns true, else returns false.",
        "context": ["all"]
    },
    "get": {
        "arguments": "subject predicate",
        "example": ["(get (query \"{\\\"select\\\":[\\\"*\\\"],\\\"from\\\":[\\\"person/handle\\\", \\\"jdoe\\\"]}\") \"_id\")"],
        "doc": "Returns the value of an predicate within an object. In this example, we extract the _id of the person using get.",
        "context": ["all"]
    },
    "contains?":  {
        "arguments": "subject value",
        "example": ["(contains? (get-all (query \"{\\\"select\\\":[\\\"*\\\"],\\\"from\\\":[\\\"person/handle\\\", \\\"jdoe\\\"]}\") [\"person/user\" \"_id\"]) 123)"],
        "doc": "Checks whether an object or hash-set contains a specific key (for objects) or value (for hash-sets). Vectors check index and NOT value. To check values of vector, convert values to hash-set first. In this example, get-all checks whether the person user contains the current user.",
        "context": ["all"]
    },
    "hash-set":  {
        "arguments": "arg1 arg2",
        "example": ["(hash-set \"orange\" \"pear\")"],
        "doc": "Returns hash-set containing all the args",
        "context": ["all"]
    },
    "upper-case":  {
        "arguments": "str",
        "example": ["(upper-case \"pear\")"],
        "doc": "Returns upper-case version of string.",
        "context": ["all"]
    },
    "lower-case":  {
        "arguments": "str",
        "example": ["(lower-case \"pear\")"],
        "doc": "Returns lower-case version of string.",
        "context": ["all"]
    },
    "nth":  {
        "arguments": "collection integer",
        "example": ["(nth [1 2 3] 0)"],
        "doc": "Returns the nth element in a collection, for example (nth [1 2 3] 0) returns 1.",
        "context": ["all"]
    },
    "get-all":  {
        "arguments": "subject [path]",
        "example": ["(get-all (query \"{\\\"select\\\":[\\\"*\\\"],\\\"from\\\":[\\\"person/handle\\\", \\\"jdoe\\\"]}\")  [\"person/user\" \"_id\"])"],
        "doc": "Returns nil or a set of all of a certain predicate (or predicate-path) from an subject.",
        "context": ["all"]
    },
    "valid-email?":  {
        "arguments": "x",
        "example": ["(valid-email? (?o))"],
        "doc": "Checks whether an object or hash-set contains a specific key (for objects) or value (for hash-sets). Vectors check index and NOT value. To check values of vector, convert values to hash-set first. In this example, get-all checks whether the person user contains the current user.",
        "context": ["all"]
    },
    "re-find":  {
        "arguments": "subject value",
        "example": ["(re-find \"^[a-zA-Z0-9_][a-zA-Z0-9\.\-_]{0,254}\" \"apples1\")"],
        "doc": "Checks whether a string follows a given regex pattern.",
        "context": ["all"]
    },
    "query":  {
        "arguments": "query-string (0.9.6+) OR select-string, from-string, where-string, block-string, limit-string",
        "example": ["(query \"{\\\"select\\\": [\\\"*\\\"], \\\"from\\\": \\\"_collection\\\"}\")",
    "(query \"[*]\" [\"book/editor\" \"Penguin\"] nil nil nil)"],
        "doc": "Queries the current database. Make sure to doubly-escape the quotation marks in the query string",
        "context": ["all"]
    },
    "?s": {
        "arguments": "string (optional)",
        "example": ["(s)"],
        "doc": "Allows you to access all the predicates of the subject that the spec is being applied to. This function takes an optional string of additional-select-parameters. By default, this function will query {\"select\": [\"*\"], from: SUBJECT}, however, if you would like to follow the subject's relationships further, you can optionally include an additional select string. You do not need to include the glob character, *, in your select string. You can either not include any quotes in the select string, or doubly-escape them, for example: `\"[{person/user []}]\" or \"[{\\\"person/user\\\" [\\\"*\\\"]}]\"`. Your select string needs to be inside of a vector, [].",
        "context": ["_predicate/spec", "_collection/spec", "_rule/fns"]
    },
    "?sid": {
        "arguments": "select-string, from-string, where-string, block-string, limit-string",
        "example": ["(query \"[*]\" [\"book/editor\" \"Penguin\"] nil nil nil)"],
        "doc": "The _id of the subject that the spec is being applied to",
        "context": ["_predicate/spec", "_collection/spec", "_rule/fns"]
    },
    "?p": {
        "arguments": "string (optional)",
        "example": ["(p)"],
        "doc": "Allows you to access all the predicates of the predicate that the spec is being applied to. This function takes an optional string of additional-select-parameters. By default, this function will query {\"select\": [\"*\"], from: PREDICATE_ID }, however, if you would like to follow the predicate's relationships further, you can optionally include an additional select string. You do not need to include the glob character, *, in your select string. You can either not include any quotes in the select string, or doubly-escape them, for example: `\"[{person/user []}]\" or \"[{\\\"person/user\\\" [\\\"*\\\"]}]\"`. Your select string needs to be inside of a vector, [].",
        "context": ["_predicate/spec", "_predicate/txSpec", "_collection/spec", "_rule/fns"]
    },
    "?pid": {
        "arguments": "none",
        "example": ["(?pid)"],
        "doc": "_id of the predicate that the spec is being applied to",
        "context": ["_predicate/spec", "_predicate/txSpec", "transaction"]
    },
    "?o": {
        "arguments": "none",
        "example": ["(< 1000 (?o))"],
        "doc": "The proposed object of the predicate that the user is attempting to add or update.",
        "context": ["_predicate/spec"]
    },
    "?pO": {
        "arguments": "none",
        "example": ["(< (?pO) (?o))"],
        "doc": "The object of the predicate that the user is attempting to add or update, as of the block before the proposed transaction",
        "context": ["_predicate/spec"]
    },
    "?auth_id": {
        "arguments": "none",
        "example": ["(== (?auth_id) (?sid))"],
        "doc": "The _id of the auth that is querying or transacting",
        "context": ["_predicate/spec", "_collection/spec", "_rule/fns", "transaction"]
    },
    "flakes": {
        "arguments": "none",
        "example": ["(flakes)"],
        "doc": "Returns an array of all flakes in the current proposed transaction. For _predicate/spec and _collection/spec this is a single flake. For _predicate/txSpec this is all the flakes in a given transaction that pertain to the specified predicate.",
        "context": ["_predicate/spec", "_collection/spec", "_predicate/txSpec"]
    },
    "objT": {
        "arguments": "none",
        "example": ["(objT)"],
        "doc": "Sum of the value of all flakes being added in the current spec.",
        "context": ["_predicate/spec", "_collection/spec", "_predicate/txSpec"]
    },
    "objF": {
        "arguments": "none",
        "example": ["(objF)"],
        "doc": "Sum of the value of all flakes being retracted in the current spec.",
        "context": ["_predicate/spec", "_collection/spec", "_predicate/txSpec"]
    },
    "relationship?": {
        "arguments": "startSubject path endSubject",
        "example": "(relationship? [\"_user/username\" \"anna\"] [\"_user/auth\" \"_auth/department\" \"company/_department\"] [\"company/name\" \"Fluree\"])",
        "doc": "0.9.6+ Returns a true or false, depending on if there is a relationship between two subjects. Start and end subjects should resolve to either subject _ids or unique two-tuples. ",
        "context": ["all"]
    }
}

module.exports = {
    smartFunctions
}