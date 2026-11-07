---
description: "VTEX or Magento? Felipe Mendes and Vitor Couto compare customization, checkout, Page Builder and Site Editor, and how moving from Magento to VTEX went."
keyPoints:
  - "For Vitor Couto, VTEX has a gentler learning curve than Magento because its front end is built entirely in React, while Magento uses Knockout."
  - "Felipe Mendes sums up the difference: Magento is 100% customizable, while VTEX is SaaS and keeps the back end and servers under its own control, with no access to the source code."
  - "Magento's Page Builder lets you drag blocks to build a page; on VTEX, the client can only edit in Site Editor the blocks of pages whose template already has a JSON Schema set up."
  - "VTEX has no local development environment: everything runs in the platform's cloud, and without internet you cannot work."
  - "According to Felipe Mendes, checkout and the account area are the most locked-down parts of VTEX, and customizing the checkout shifts part of the responsibility for problems to whoever customized it."
  - "Vitor Couto says the VTEX checkout is also built in Knockout and that it took him about three to four months to feel comfortable overriding the platform's native components."
faq:
  - question: "Is VTEX better than Magento?"
    answer: "According to Vitor Couto and Felipe Mendes, it depends. Vitor says VTEX is easier for beginners because it uses React. Felipe says the choice depends on the client's processes: companies with many rules and customizations tend to fit Magento better, since it is 100% customizable, while VTEX is a SaaS with closed parts."
  - question: "What should you learn to move from Magento to VTEX?"
    answer: "Vitor Couto recommends React above all, including state management, and TypeScript, since VTEX writes its own apps in it. He also mentions Sass, which is easy to integrate and similar to Magento's Less, and JSON Schema, which links component properties to what the client edits in Site Editor."
  - question: "Can you customize the VTEX checkout?"
    answer: "Yes, with limits. Vitor Couto explains that the VTEX checkout is built in Knockout with no access to that layer, and that larger customizations are done with JavaScript and CSS through the checkout editor in the admin. Felipe Mendes says checkout and the account area are the platform's most closed parts and that customizing them can cause problems with every update."
  - question: "What happens when a VTEX project strays from the recommended standards?"
    answer: "According to Felipe Mendes, it becomes bug after bug: you fix one problem and another appears. Vitor Couto mentions a project that moved elements on screen with plain JavaScript instead of overriding React components. In that case the team turned to VTEX Pro, a paid service with sessions with a VTEX architect and a dedicated contact for questions."
  - question: "What does it take to start working as a Product Owner in e-commerce?"
    answer: "For Felipe Mendes, a PO has to become the owner of the business: understand the client's processes and goals, such as three-month OKRs, and turn them into tactical tasks. He also recommends knowing how the platform is structured so you can explain to stakeholders what is possible and estimate best and worst cases."
---
In the third episode, Jonatan Machado and Maria Ferro talk with Felipe Mendes and Vitor Couto, who work together at an e-commerce agency. Vitor has about a year of experience building VTEX stores and previously worked with Magento; Felipe is a Product Owner with a degree in production engineering who started at the agency doing support for Magento 2 stores.

On **VTEX vs Magento**, both answer "it depends". Vitor highlights the React front end, page structure defined in JSON, back-end apps in Node and the lack of a local environment, since everything runs in VTEX's cloud; he expects FastStore to change that. Felipe contrasts VTEX's SaaS model with Magento's full freedom and Page Builder with Site Editor, and explains why he pushes back on many checkout and account-area customizations. Maria Ferro finds registering products and SKUs in the VTEX admin, one page at a time, outdated. They also cover the free-shipping progress bar, a common request that takes real work on VTEX, a huge Avon process flowchart shown at a VTEX event and the paid VTEX Pro service.

The second half turns to careers and mental health. Vitor started as an intern on the older version of VTEX, worked with Magento at a tourism company and now wants to work on a product. Felipe describes how the company adopted agile, the "development script" that made estimates more accurate and the virtual office on Gather. On anxiety, Vitor walks and runs with his dog, and Felipe went back to wearing out his body with swimming, fighting, skateboarding and running after a crisis. Their advice to their younger selves: **take it easy**, don't try to embrace the world and don't be afraid to make mistakes.
