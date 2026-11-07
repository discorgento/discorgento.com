---
description: "How the discorgento/module-migrations module simplifies Magento 2 data patches to version admin configuration and CMS pages in code."
keyPoints:
  - "discorgento/module-migrations is a simplifier for Magento 2's native data patches, which are used to move changes made in the admin or database into code."
  - "Instead of implementing the four methods required by a native data patch's interfaces, you extend the module's Migration class and implement a single required method."
  - "The module ships facades, inspired by the Laravel concept, for the most common changes, such as setting configuration values and creating or updating CMS pages."
  - "Each migration runs only once during setup:upgrade and is recorded in the patch_list table; deleting that record makes it run again on the next upgrade."
  - "The video recommends keeping migrations atomic, one change per file, because they run in alphabetical order on outdated databases."
faq:
  - question: "What is the discorgento/module-migrations module?"
    answer: "It is an open source module by discorgento that simplifies Magento 2 data patches, the native way to write database migrations. According to the video, it lets you version changes made in the admin, such as configuration and CMS content, in code so they are applied automatically to other environments and to teammates' machines."
  - question: "How do you create a migration with the Migrations module in Magento 2?"
    answer: "The file goes in the module's Setup/Patch/Data folder like any data patch, but it extends discorgento's Migration class and implements only the required method. Inside it, facades do the work: in the video's example, the configuration method takes the path and the value to switch the store currency to Brazilian real, and it also accepts a scope and store."
  - question: "Does a Magento migration run more than once?"
    answer: "No. According to the video, the run is recorded in the patch_list table, and running setup:upgrade again does not execute the same migration. During development, deleting its record from that table makes it run again."
  - question: "How do you keep a CMS page up to date with migrations?"
    answer: "The video creates a CMS page from its identifier, title, content heading and content, then updates the home page content in a separate migration. To change the content later, the advice is to create a new migration, such as a V2, rather than edit the old one, since migrations run in alphabetical order."
  - question: "Can I delete data directly in the Magento database?"
    answer: "The video advises against it: deleting something straight from the database can always leave side effects and residual data, while deleting through the admin removes everything related. In the example, the page removed by hand in the database left leftovers the admin would have cleaned up."
---
In this short video, discorgento officially announces **discorgento/module-migrations**, a module that had already been used in production and is presented as stable. As explained, a migration tracks database changes in code: in Magento, a change made in the admin stays in your local database and never reaches other environments or teammates, who would have to redo it by hand or import an updated database.

Magento 2 already solves this with data patches, but the native skeleton requires four interface methods. The module reduces this to extending the Migration class and implementing a single method, using **facades** for the most common tasks, a concept the video compares to Laravel's. The first example switches the store currency to Brazilian real with the configuration method, which takes the path and value and accepts a scope and store. The migration runs on setup:upgrade, is recorded in the patch_list table and never runs twice.

The second example creates a demo CMS page and inserts it into the home page, keeping the page creation and the home update in separate migrations. The video's golden rule is to keep each migration atomic, since they run in alphabetical order, and to create a new version to change content later. It also warns against deleting data directly in the database and points to the module wiki, which documents other facades, such as those for attribute management.
