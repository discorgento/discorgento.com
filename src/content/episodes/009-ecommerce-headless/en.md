---
description: "Raul Sakai explains headless e-commerce and PWA on Magento: what they are, when they pay off and what they cost in development, caching and infrastructure."
keyPoints:
  - "To Raul Sakai, headless means a front end running fully apart from the back end and talking to it only through APIs (REST or GraphQL), not necessarily React with GraphQL."
  - "On Magento, the best-known headless route is PWA Studio with the Venia storefront; PWA includes headless and adds features such as service workers and offline support."
  - "Raul's advice is to never start a Magento project as headless if it can respect Varnish's cache structure (customer group, store view and URL)."
  - "According to him, moving to PWA after the store has stabilized costs less than starting the project from scratch as a PWA."
  - "Raul estimates that Magento without Varnish needs 40% to 60% more infrastructure, and that a well-configured Varnish reaches a 70% cache hit rate."
  - "On Adobe Commerce Cloud, deploying a headless front end is just one extra step that compiles the front end at the end of the process."
faq:
  - question: "What is the difference between headless and PWA on Magento?"
    answer: "According to Raul Sakai, headless is the architecture in which the front end runs separately from the back end and consumes everything through APIs. A PWA includes headless and adds app-like features, such as installing the site on a phone, service workers and keeping the cart offline. On Magento this takes the form of PWA Studio and the Venia storefront."
  - question: "Is it worth starting a Magento store as headless from day one?"
    answer: "Raul Sakai says almost never: if the project can respect Magento's cache, he recommends starting with the monolith. He suggests headless from the start in two cases: when there is plenty of money and time, or when the business needs more granular caching, such as a B2B catalog with prices calculated outside Magento."
  - question: "Does headless slow down Magento development?"
    answer: "According to Raul Sakai, the back-end logic barely changes, but the time goes up: you need GraphQL schemas and resolvers, documentation for the front end and components implemented in Apollo. Testing also gets harder because the back end only validates data going in and out. He once moved a client off PWA and back to the monolith because of development speed."
  - question: "Is headless Magento better for performance and SEO?"
    answer: "Raul Sakai says a headless front end is naturally faster because it ships less HTML, CSS and JavaScript, but poorly built APIs and resolvers will make the store slow. As for SEO, he says it is no longer a problem as long as best practices are followed, since Google now executes the page's JavaScript."
  - question: "Do third-party Magento modules work with PWA Studio?"
    answer: "It depends on the module, according to Raul Sakai. Some already ship GraphQL support and Venia components, but you still have to fit them into your layout; modules without headless support require you to study them and write your own GraphQL resolvers and endpoints."
---
Raul Sakai, who teaches free Magento classes on The IT Nerd server, talks with Jonatan Machado and Maria Ferro about **headless e-commerce** and PWA on Magento. He separates the two ideas: headless is a front end running apart from the back end and talking to it only through APIs; a PWA, such as PWA Studio with the Venia storefront, includes that and adds app-like features. Technically, he says, it beats the monolith, but it costs you in process: GraphQL schemas and resolvers, Apollo components, harder testing, and back end and front end having to work as a single team.

His recommendation is blunt: if the project can respect Varnish's cache, start with the monolith and move to PWA only once the store is stable, which is cheaper than being born as a PWA. The exceptions are teams with money and time to spare and businesses that need more granular caching, such as a B2B catalog with prices calculated outside Magento. Raul also covers performance, SEO, Page Builder, major PWA Studio upgrades, the Apollo cache, infrastructure cost and a project where search was wired straight to an external service through a RabbitMQ queue and kept showing wrong prices in the catalog.

On the personal side, he says he started programming at 12, studied design in São Paulo, worked for Dufry in Rio de Janeiro and opened Infobase's Magento unit, where the team built 198 sites for Dufry in one year on a single codebase. He also describes the open modules he builds in his classes (Core, Brasil, performance and UX) and leaves one piece of advice: **developers need to understand business**, not just technology.
