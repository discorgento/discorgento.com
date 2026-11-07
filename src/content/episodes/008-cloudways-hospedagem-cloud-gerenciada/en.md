---
description: "Cloudways representatives show how managed cloud hosting launches Magento in one click and handles the server, caching, backups and hourly billing."
keyPoints:
  - "According to the company's representatives, Cloudways started in 2012 as a managed cloud hosting platform and was acquired by DigitalOcean."
  - "Cloudways is not a cloud provider but a management layer: customers choose between providers such as DigitalOcean, Vultr, Linode, AWS and Google Cloud, always through the same dashboard."
  - "In the demo, creating a Magento 2.4.6 app warned that the version requires PHP 8.1, and the platform recommended a 4 GB server for Magento versus 2 GB for WordPress."
  - "A server can be cloned to another provider, for example from DigitalOcean to AWS, carrying over settings, domains, cron jobs and access."
  - "Billing is pay-as-you-go, calculated by the hour: running a server for 15 days and then deleting it means paying for those 15 days only."
  - "The dashboard includes Varnish, Cloudflare Enterprise CDN from about 5 dollars, IP whitelisting for SSH and MySQL, local or off-site backups, staging, free SSL and Git deployment."
faq:
  - question: "What is Cloudways?"
    answer: "According to the Cloudways representatives in the episode, it is a managed cloud hosting platform founded in 2012 and now part of DigitalOcean. It is not a cloud provider itself: it manages servers on providers such as DigitalOcean, Vultr, Linode, AWS and Google Cloud, so customers can focus on the business instead of server administration."
  - question: "Can you host Magento on Cloudways?"
    answer: "Yes. In Jyoti's demo, Magento is installed in one click, with no Composer or SSH, and the platform flags the requirements of the chosen version, such as PHP 8.1 for Magento 2.4.6. The recommended server size for Magento was 4 GB, and the dashboard hands you the store URL, admin URL and database credentials."
  - question: "How does Cloudways pricing work?"
    answer: "According to the Cloudways representatives, it is pay-as-you-go with hourly billing: you only pay for the time the server existed, so using it for 15 days and deleting it costs 15 days, not the whole month. They also mentioned a three-day free trial. Off-site backups and add-ons such as premium support are charged separately."
  - question: "How do you move a server from one cloud provider to another on Cloudways?"
    answer: "In the episode, the Cloudways representatives demo the clone server feature: you choose what to carry over (settings, domains, cron jobs, credentials, team access) and the target provider, for example moving from DigitalOcean to AWS. The same screen handles vertical scaling, such as going from a 4 GB standard server to an 8 GB premium one."
  - question: "What monitoring tools does Cloudways offer for Magento?"
    answer: "According to Jyoti, the application dashboard shows traffic, top IPs and URLs, bot traffic, HTTP status codes, slow PHP pages, active MySQL connections and slow queries, cron jobs, and access and error logs for Apache, Nginx and PHP. Ivan Augusto also pointed out the New Relic integration."
---
In this episode, recorded in English, Ivan Augusto, known as CodeSlicer, interviews a company instead of a developer for the first time: two representatives of **Cloudways**, a managed cloud hosting platform. One introduces himself as general community manager, with around seven years in digital marketing and four at Cloudways; Jyoti, also a community manager, mentions more than four years of web development experience, mostly on e-commerce projects with Magento and Laravel.

They explain that Cloudways was founded in 2012 to take cloud server administration off the customer's plate, and that it was acquired by DigitalOcean. In a live demo, Jyoti launches Magento 2.4.6 in one click, and the dashboard warns that the version needs PHP 8.1 and recommends a 4 GB server. The conversation covers choosing a provider (DigitalOcean, Vultr, Linode, AWS and Google Cloud), standard and premium servers, Varnish and Cloudflare Enterprise CDN, cloning servers across providers and **hourly billing**.

Then comes a tour of the dashboard: SSH credentials, CPU, memory and disk monitoring with up to six months of history, IP whitelisting for SSH and MySQL, scheduled backups, SMTP, staging, traffic and slow-query analysis, cron jobs, logs, free SSL, Git deployment and PHP-FPM and Varnish settings without the command line. Ivan stresses that the episode is not paid advertising: Jonatan Machado had already used the service and suggested the conversation.
