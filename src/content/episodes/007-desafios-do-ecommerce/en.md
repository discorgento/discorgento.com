---
description: "Thiago Marquesini on the challenges of Magento e-commerce: scalability, LGPD, SEO, legacy code and moving from PHP frameworks to Magento 2."
keyPoints:
  - "Between 2015 and 2016, Thiago advised against Magento 2 for a dental prosthesis manufacturer with a tight budget and no IT team, and the project went to Loja Integrada instead."
  - "For Ivan Augusto, the biggest technical challenge in e-commerce is scalability, such as avoiding N+1 queries by loading each product model inside a catalog loop."
  - "Thiago applies the Pareto principle to requirements: trimming part of the requested business rules usually keeps the value while cutting the effort a lot."
  - "Thiago found Magento's XML bureaucratic at first, but praises plugins (before, after and around) for changing classes without touching third-party code, and says Knockout is hard to debug."
  - "In a project for a national institution with one store per state, Magento handled around 78 integrations."
  - "Thiago recommends learning a language's limits, such as very large numbers in PHP and 0.1 + 0.2 in JavaScript, and credits HackerRank with helping him do that."
faq:
  - question: "What is the biggest challenge of a Magento e-commerce store?"
    answer: "For Ivan Augusto, it is scalability: without a few basic rules the code turns into spaghetti, as with N+1 queries from loading products one by one. Thiago Marquesini adds that production volume is far larger than local test data, so you cannot always use models and have to watch performance, memory and design patterns."
  - question: "Is Magento or a PHP framework like Laravel better for e-commerce?"
    answer: "According to Thiago Marquesini, Magento is entirely focused on e-commerce and ships with a structure to extend features and scale, for example running with Varnish and Elasticsearch. With a framework like Laravel, caching, scaling and architecture have to be built by hand. On the other hand, he notes that Magento developers are harder to find and more expensive, which raises the total cost of ownership."
  - question: "Can you upgrade from Magento 1 to Magento 2?"
    answer: "In the episode the hosts explain there is no direct upgrade from Magento 1 to 2: you install a new store and import the data. Many Magento 1 concepts, such as events and attributes, carry over, but the database is practically the only thing reused."
  - question: "How does Brazil's LGPD affect e-commerce projects?"
    answer: "Thiago Marquesini says that in the projects he works on, LGPD is still not taken very seriously because the law had a long adaptation period. He believes that within one or two years it will become a constant concern and start to hurt store operations, as already happens in Europe."
  - question: "How does Thiago Marquesini deal with anxiety working in tech?"
    answer: "He says therapy helped him control anxiety, that he is transparent with his team and Scrum Master about what he can deliver, and that he keeps set hours to start and stop working. He also says sports like jiu-jitsu help him stay calm in uncomfortable situations."
---
In the seventh episode, Jonatan Machado, Maria Ferro and Ivan Augusto host Thiago Marquesini, who works as a developer and has several years in IT, most recently in the Magento world. His first contact with the platform came between 2015 and 2016, when he advised a dental prosthesis manufacturer against the newly launched Magento 2 and ended up customizing a Loja Integrada store with JavaScript in the footer. The deeper experience came at a company going through digital transformation, where he worked alongside the partner agency and built an in-house development team.

On the **challenges of e-commerce**, Ivan points to scalability, while Thiago talks about balancing what the business wants against the effort, using the Pareto principle and MVPs. The conversation covers data security and LGPD, accessibility (including a Canadian client that was fined and an accessibility index required by the Brazilian government) and SEO, with a mention of a Meet Magento talk about user reviews counting toward rankings.

Thiago compares Magento with CodeIgniter, Laravel, Symfony, Slim and Phalcon: he praises plugins and the code organization, criticizes how hard Knockout is to debug and defends the platform's more conservative pace, citing total cost of ownership. He also recalls a project with about 78 integrations, a checkout whose tax substitution logic lived in two phtml files of roughly a thousand lines each, an online exam system used by 900 students at once and a PHP library that analyzed pasture photos by their average RGB. He closes on anxiety, therapy, jiu-jitsu and the advice he would give his younger self: **take more risks**.
