# Fluree Smart Function Helper

The Fluree Smart Function Helper extension is designed to make it easier to write and test Fluree smart functions. This extension connects to a single database, and allows you to use Clojure to test and update smart functions with that database. 

Please note this is a beta version of the Fluree Smart Function extension. The extension is provided "as is."

This documentation includes the following sections:

1. Starting Up
2. Project Namespaces
2. Commands
3. Testing Functions

## 1. Starting Up

### Config File

To successfully run the extension, you must have a `flureeConfig.json` file, which should include a single map with the following key-value pairs. 

```
{
    "network": "example",
    "db": "one",
    "ip": "http://localhost:8090"
}
```

### Dependencies

You must have [Leiningen](https://leiningen.org/) installed. Leiningen and Clojure require Java. Java 8 is recommended.

You must have Fluree versions 0.9.6 and higher. 

### Fluree: Activate Smart Function

Before you can activate the extension, make sure your `flureeConfig.json` is properly set up, and make sure that a downloadable version of Fluree (version 0.9.6. or higher) is running, has the specified network and database, and has an open-api (signing of transactions is not required; we intend to support non-open-api Fluree databases in the future). If you do not have a version of Fluree running, then please visit [Installing Fluree](https://docs.flur.ee/docs/getting-started/installation) to learn how to set it up.

To initiate Fluree, press `cmd` + `shift` + `p` to open the VS Code Extension dropdown. Select or type `Fluree: Activate Smart Function`.

`Fluree: Activate Smart Function` will create a new Clojure project, if necessary, with all that necessary namespaces to allow you to test your smart functions. It will also fetch your database's schema, auth records, and functions.

This command will first check if there is a `project.clj`. If there is a `project.clj`, it will also check the `.VERSION` file. 

If there is no `project.clj`, then `Fluree: Activate Smart Function` will create the following files in your directory.

Additionally, if there is a more recent version of the Fluree [Smart Function Lein Template](https://clojars.org/api/artifacts/smart-function/lein-template) on Clojars, you will have the option of updating your Clojure project.

```
├── src/
│   └── [ROOT DIR NAME]/
│       ├── core.clj
│       ├── custom_functions.clj
│       ├── fns.clj
│       ├── internal.clj
│       └── temp_custom_functions.clj
├── .gitignore
├── .VERSION
├── project.clj
└── README.md
```

Note that if you have any of these files in your directory already, this command will OVERWRITE them. Anything you want saved indefinitely should live on your database NOT in the VS Code Extension directory. 

## 2. Project Namespaces

After successfully starting up your project, you should see the following namespaces in your working directory: 

### core.clj

The `core.clj` namespace is the main namespace in this project. It has a function to test smart functions (`test-fn`) and a function to find which smart functions are triggered in a certain transaction (`find-all-applicable-rules`). This is main namespace you will be working out of. 

In this namespace, we suggest testing your functions in the `comment` block. More information about using this namespace is in the Testing Functions section.

#### custom_functions.clj

This namespace contains all the smart functions that are currently in your database. Any changes made to these functions DO NOT change the smart functions in your database, and we strongly advise AGAINST making any changes to this file. If you want to update a smart function that is currently in your database, you can use the command `Fluree: Edit and Push a DB Function`, which is explained in more detail in the Commands section.

When you add a temporary function to your database (via `Fluree: Push Temp Function to DB`) or edit any existing smart function (`Fluree: Edit and Push a DB Function`), then the functions in this namespace will update. Additionally, you manually trigger this namespace to update via `Fluree: Refresh DB Functions`. How to use the commands specified in this section is explained in detail in the Commands section.

#### fns.clj and internal.clj

`fns.clj` and `internal.clj` include all the builder functions that are available to you to use by default. A [full list of smart functions](https://docs.flur.ee/docs/smart-functions#universal-functions) can be found in the documentation.

Broadly speaking, `fns.clj` handles creating a stack for smart function calls, while `internal.clj` calls the actual functions. We strongly advise against changing any of the functions in `fns.clj` or `internal.clj`, as these functions closely mirror the actual behavior of calling these functions in Fluree DB. 

#### temp_custom_functions.clj

This file contains smart functions that you are testing out, but have not been pushed to your Fluree ledger yet. Functions in this namespace can be tested, but are not saved to your database unless you issue the command, `Fluree: Push Temp Function to DB`. Using commands is explained in detail in the Commands section.

`temp_custom_functions` and `core` are the two namespaces that you should edit. Note, you cannot add any documentation to the functions in `temp_custom_functions`, otherwise you will not be able to push them to the database.

## 3. Commands

### Fluree: Create Temp Function

The `Fluree: Create Temp Function` command allows you add functions to the `temp_custom_functions.clj` namespace. Once added to this namespace, you will be able to test these functions in various situations to see if they perform as you expect.

To issue the command, press `cmd` + `shift` + `p` to open the VS Code Extension dropdown. Select or type `Fluree: Create Temp Function`. After you fill out the prompts, your function will be added to `temp_custom_functions.clj`.

Note, that in order to use that function, you need a REPL running, you'll need to `Calva: Load current namespace in REPL terminal` for  `temp_custom_functions.clj`, and then do the same (`Calva: Load current namespace in REPL terminal`) for `core.clj`. (The keyboard shortcut for `Calva: Load current namespace in REPL terminal` as of version 2.0.11 is `ctrl` + `option` + `c`, release then `ctrl` + `option` + `n`). 

### Fluree: Smart Function Help

The `Fluree: Smart Function Help` will show you all of the built-in functions that come with Fluree. You can also see examples of using this functions, as well as documentation and other information.

### Fluree: Push Temp Function to DB

The `Fluree: Push Temp Function to DB` command will allow you to choose the name of a function in `temp_custom_functions.clj`. It will allow you the option to edit that function's name, doc, parameters, and code.

It will add that function to your database, and remove the function from `temp_custom_functions.clj`. After successfully adding the function to the database, this command also refreshes the custom functions file (`custom_functions.clj`), so any manual changes you made to that page will be lost (you should not be editing `custom_function.clj` regardless). 

### Fluree: Edit and Push a DB Function

The `Fluree: Edit and Push a DB Function` command will allow you to choose the name of a function currently in your database (this should be the same as the functions in `custom_functions.clj`). It will allow you the option to edit that function's name, doc, parameters, and code.

If you make any changes to that function, those changes will be pushed to your database, and the `custom_functions.clj` namespace will be updated. 

Note: If you do not see the changes you just made, you can run `Fluree: Refresh Custom DB Functions`. 

### Fluree: Add DB Function to Spec

The `Fluree: Add DB Function to Spec` command allows you to add a database function (not a temp function) to a given spec. 

First, you will choose whether you want to add a `_collection/spec`, `_predicate/spec`, or `_predicate/txSpec`. Then you will choose the `_collection` or `_predicate` your want to add that function to. 

Finally, you will choose between smart functions that are currently in your database. This command will then update your database accordingly. 

From this point forward, when you issue a transaction that includes the given `_collection` or `_predicate`, the smart function you specified will be triggered. Note, that if you selected a smart function that takes parameters as a spec, the parameters will be ignored when the smart function is triggered. To learn more about smart functions, please read the [smart function section](https://docs.flur.ee/docs/smart-functions) in our docs. 

### Fluree: Refresh DB Functions

The `Fluree: Refresh DB Functions` will pull all the smart functions from your database, and update `custom_functions.clj` accordingly. This command is called automatically on `Fluree: Activate Smart Functions`, `Fluree: Edit and Push a DB Function`, and `Fluree: Push Temp Function to DB`. 

However, if you made a change to your smart functions outside of these commands (i.e. through an API call), then you should call `Fluree: Refresh DB Functions` to update `custom_functions.clj`.

## 4. Testing Functions

Before you can test your functions, you need to make sure that you have your configuration properly set up, and you have run `Fluree: Activate Smart Functions`. You need to run this every time you use the extension. It will "wake" up the extension, as well as refresh your smart functions. 

### 1. Starting Up the REPL

In order to test out your custom smart functions, you need to have a running REPL. In order to do this, you need to:

1. Open up a terminal (`control` + ` ). 
2. Type `lein repl` to start a REPL (you need leiningen installed on your computer for this to work).
3. To use the Calva extension (recommended and it comes with this extension), press `cmd` + `shift` + `p` to open up the VS Code Command Palette and select `Calva: Connect to a running REPL server`.
4. You will be asked for a `cljs project type`, select `None`.
5. Then you will be asked for the port where the nREPL is located. This may be automatically populated for you, in which case you can just press enter. Otherwise, you can check your terminal. After you started a REPL (step 2), there will be a log output with the port number. For example, `nREPL server started on port 56021 on host 127.0.0.1 - nrepl://127.0.0.1:56021`.
6. This may open up a new tab in VS Code with the heading, `CLJ REPL`, you can close this.

## 2. Loading up `core.clj` 

Once you have a REPL started and Calva is connnected, you need to load up the `core.clj` namespace. To do so:

1. Open up `core.clj`.
2. Press `cmd` + `shift` + `p` to open the VS Code Command Palette, and select `Calva: Load current namespace in REPL terminal`.
3. Navigate to the terminal `Output` tab, and check the logs for errors.

If there are errors, a common issue is improper syntax in your database smart functions. For example, you might get an error like:

```
Syntax error reading source at (custom_functions.clj:153:237).
Unmatched delimiter: )
```

If you get an error like this one, you should go to the referenced line (153), and see if you can find the syntax error. If you find the error, you should NOT change the function code directly in the `custom_functions.clj` namespace. This will NOT fix the issue for you in your database. Rather, you should issue the `Fluree: Edit and Push a DB Function` command. 

### Testing Functions

The only place where you should write any code is in the `core.clj` namespace in the `comment` block. That namespace contains the following functions:

- `find-all-applicable-rules` : given a transaction, and optionally an auth record, it returns all the smart functions that are triggered. 

- `test-fn` : before adding a smart function to a spec (i.e. `_predicate/spec`), you can see test it out as if it was part of that spec. 

- `test-txn` : test a hypothetical transaction. This function return the resultant flakes as if a transaction was issued, but your database IS NOT CHANGED.

- `blank-ctx` : creates a blank context object. You can use this to test out an smart function that are not context-dependent. See examples below. 

#### Find All Applicable Rules

This function takes a transaction, and returns the list of rules that apply to it, including any `_predicate/spec`, `_predicate/txSpec`, `_collection/spec`, and auth-specific rules. If you don't provide an auth record, the function uses a root-auth, otherwise it uses your provided auth record.

For example, I might want to test out the following transaction: 

```
[{
    "_id": "person",
    "handle": "aJay",
    "favNums": [12, -4, 57]
}]
```

I need to make sure to write my transaction as a Clojure map wrapped in a vector as the only argument of the function `find-all-applicable-rules`:

```
    (find-all-applicable-rules [{ :_id "person" :handle "aJay" :favNums [12, -4, 57] }] )
```

To run this command, make sure `core.clj` is loaded in the REPL (`Calva: Load current namespace in REPL terminal`). There are a number of ways to issue this command. For example, you could click on the outer parentheses of the above function, and then issue `Calva: Evaluate current top-level (aka defun) form and pretty-print`. This manner of issuing the command prints the results in the Output tab (if you do not see it, make sure `Calva says` is selected).

There are a number of ways to issue and print commands, which you can read more about in the [Calva documentation](https://github.com/BetterThanTomorrow/calva/blob/master/etc/calva-top-10-commands.md).

The result of this function will depend on your database, but for example you might get (expanded):

```
({
    :_collection {:name "person", :spec nil}, 
    :_predicate [
        {:spec [{   :_id 70368744178674, 
                    :_fn/name "nonNegative?", 
                    :_fn/code "(<= 0 (?o))", 
                    :_fn/doc "Checks that a value is non-negative" }], 
        :name "person/favNums"}], 
    :_auth {:_id 105553116266496, 
    :rules {:rules [{   :_id 140737488355328,
                        :_rule/id "root", 
                        :_rule/doc "Root rule, gives full access", 
                        :_rule/collection "*", 
                        :_rule/predicates ["*"], 
                        :_rule/fns [{:_id 70368744177664}], 
                        :_rule/ops ["all"]}]}]}
})
```

For this example, there are not `_collection/spec`s for the relevant collection (`person`).

There is a `_predicate/spec` for `person/favNums`, and we can see the function that is triggered `nonNegative?`. 

For auth-specific rules, we see that, because we are using an auth record with root permissions, the `root` rule is displayed. 

#### Test Function 

`test-fn` allows you to test any function (from either your temp functions or your database's custom functions) as a `_predicate/spec`, `_predicate/txSpec`, or `_collection/spec`.

This function takes a transaction, a function, and opts.

Arguments:

- The transaction should be submitted as a Clojure map wrapped in a vector, i.e. `[{ :_id "person" :handle "aJay" }]`.

- To specify the function, just use the function name, i.e. `shorterThan5`. You must use a function named in either `temp_custom_functions` or `custom_functions` (make sure your REPL has loaded the most recent version of these namespaces).

- The opts object should have the following items:

  - `:type` (required) - `_predicate/spec`, `_predicate/txSpec`, or  `_collection/spec`
  - `:predicate` - The predicate name, i.e. `person/handle`. This is required if your type is `_predicate/spec` or `_predicate/txSpec`.
  - `:collection` - The collection name, i.e. `person`. This is required if your type is `_collection/spec`.
  - `:auth_id` - Any existing auth id to test the function with. If not specified, will use an auth record with root permissions.
  - `:params` - If the function takes any params, you can specify a vector of params

For example, if you have a function, shorterThan5 that checks whether a word is shorter than 5 characters. You might want to test that function as if it is attached to the `person/handle` `_predicate/spec`. You would issue the following function call:

```
(test-fn [{ :_id "person" :handle "aJay" }] shorterThan5 {:type "_predicate/spec" :predicate "person/handle"})
```

To issue this transaction, make sure `core.clj` is loaded in the REPL (`Calva: Load current namespace in REPL terminal`). There are a number of ways to issue this command. For example, you could click on the outer parentheses of the above function, and then issue `Calva: Evaluate current top-level (aka defun) form`.

This Calva command will print the results of `test-fn` directly next to the function you just called. `test-fn` returns the result of the calling `shorterThan5` within the particular context that we specified. In this case, `test-fn` returns `true`, because `(count (?o))` - in this case `count` of `aJay`, is in fact less than 5.

If we issued the same function, `shorterThan5`, but we used the handle `alexanderJ`, then `test-fn` will return `false`.

```
(test-fn [{ :_id "person" :handle "alexanderJ" }] shorterThan5 {:type "_predicate/spec" :predicate "person/handle"})
```

The Output tab shows the stack as the smart function was called. 

```
<!-- First we get the result of (?o), which is the object, and in this case 'alexanderJ' -->
<!-- The second item in the result stack vector is 'fuel', this is a measure of work, and can be ignored here. -->

[{:function ?o, :arguments ?ctx, :result alexanderJ} 10]

<!-- Next, the result of applying count on 'alexanderJ' is 10. -->
[{:function count, :arguments alexanderJ, :result 10} 19]

<!-- Finally, we check if 10 is less than 5, and the result is false. -->
[{:function >, :arguments [(5 10)], :result false} 29]

```

Note: this function does not actually issue the transaction to the database. Your database will NOT be updated based on calling this function.

#### Test Transaction

This function takes a transaction (in the form of a Clojure map wrapped in a vector). If the function succeeds, the function will return a list of resulting flakes.

For example, we could use `test-txn` on the following transaction:

```

(test-txn [{ :_id "person" :handle "aJay" :favNums [12, -4, 57] }] )

```
To issue this transaction, make sure `core.clj` is loaded in the REPL (`Calva: Load current namespace in REPL terminal`). There are a number of ways to issue this command. For example, you could click on the outer parentheses of the above function, and then issue `Calva: Evaluate current top-level (aka defun) form and pretty-print`.

If the function succeeds, the function will return a list of resulting flakes. If it fails, we will see the error explaining why it failed.

Note, you cannot use an function in the transaction that have not been added to the database. For example, if the function `add20` is in temp_custom_functions, a transaction like the below will NOT work.

```

(test-txn [{:_id \"person\", :age \"#(add10 50)\"}])

```

Note: this function does not actually issue the transaction to the database. Your database will NOT be updated based on calling this function.

#### Note: ctx Argument
When a smart function runs in Fluree, there is a context object that is automatically injected as the first parameter. Depending on how the smart function is being triggered (i.e. through a transaction, through a rule, or through a schema spec), the key-value pairs in this context object will be different (they reflect a context).

For example, in your database, you might have a smart function `(boolean (get (myObject) \"person/handle\"))`. When that smart function is triggered in Fluree, every single nested function gets the same context object, `(boolean ctx (get ctx (myObject ctx) \"person/handle\"))`.

All of the function in `custom_functions.clj` and `temp_custom_functions` have this `ctx` object as a first argument. This argument is automatically injected for you - you do not have to add it yourself. 

Additionally, the body of the functions in `custom_functions.clj` and `temp_custom_functions` have `ctx` as the first argument in every nested function. For example, if you have a function like `(+ 10 (- 30 n))`, it will appear in your namespace as `(+ ctx 10 (- ctx 30 n))`.

#### Blank Ctx

In the previous section, we described the role of context objects. This object carries the context in which it is being called. If you want to test out a function that only uses [Universal Smart Functions](https://docs.flur.ee/docs/smart-functions#universal-functions) (in other words, no context-dependent functions, like `(?o)`), you can use the `blank-ctx` function to test them.

For example, let's say I have a function in either `temp_custom_functions` or `custom_functions` called `add50`. The code of `add50` is just `(+ 50 n)`.

I can use a blank context object to test this function out. 

```

(add50 (blank-ctx) 100)

```

Making sure that I have not made any changes to `temp_custom_functions` or `custom_functions` since I last loaded them into the REPL terminal, and making sure that `core` is loaded in the REPL terminal, I can click on the outer parentheses of this function, and issue the Calva command `Calva: Evaluate current top-level (aka defun) form`. This should return 150.

#### Note: Updating a Namespace

When you make an update to a namespace (i.e. `custom_functions.clj` or `temp_custom_functions.clj`) either manually or via a Fluree command, you must first load the updated namespace into the REPL (issue the command, `Calva: Load current namespace in REPL terminal`) and then load the `core.clj` namespace into the REPL.

