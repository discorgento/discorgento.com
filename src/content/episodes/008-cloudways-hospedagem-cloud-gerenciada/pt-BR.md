---
description: "Representantes da Cloudways mostram como a hospedagem cloud gerenciada sobe um Magento em um clique e cuida de servidor, cache, backup e cobrança por hora."
keyPoints:
  - "Segundo os representantes da empresa, a Cloudways começou em 2012 como plataforma de hospedagem cloud gerenciada e foi comprada pela DigitalOcean."
  - "A Cloudways não é um provedor de nuvem, e sim uma camada de gestão: o cliente escolhe entre provedores como DigitalOcean, Vultr, Linode, AWS e Google Cloud, sempre com o mesmo painel."
  - "Na demonstração, a criação de um Magento 2.4.6 alertou que a versão exige PHP 8.1, e a plataforma recomendou servidor de 4 GB para Magento contra 2 GB para WordPress."
  - "Um servidor pode ser clonado para outro provedor, por exemplo da DigitalOcean para a AWS, levando configurações, domínios, cron jobs e acessos."
  - "A cobrança é pay-as-you-go, calculada por hora: quem usa um servidor por 15 dias e o apaga paga só esses 15 dias."
  - "O painel inclui Varnish, CDN Cloudflare Enterprise a partir de cerca de 5 dólares, whitelist de IP para SSH e MySQL, backups locais ou externos, staging, SSL gratuito e deploy via Git."
faq:
  - question: "O que é a Cloudways?"
    answer: "Segundo os representantes da Cloudways no episódio, é uma plataforma de hospedagem cloud gerenciada criada em 2012 e hoje parte da DigitalOcean. Ela não é um provedor de nuvem: gerencia servidores em provedores como DigitalOcean, Vultr, Linode, AWS e Google Cloud, para que o cliente foque no negócio e não na administração do servidor."
  - question: "Dá para hospedar Magento na Cloudways?"
    answer: "Sim. Na demonstração de Jyoti, o Magento é instalado em um clique, sem Composer nem SSH, e a plataforma avisa os requisitos da versão escolhida, como PHP 8.1 para o Magento 2.4.6. Para Magento, o tamanho de servidor recomendado foi de 4 GB, e o painel já entrega URL da loja, URL do admin e credenciais de banco."
  - question: "Como funciona a cobrança da Cloudways?"
    answer: "Segundo os representantes da Cloudways, o modelo é pay-as-you-go com cálculo por hora: você paga só pelo tempo em que o servidor existiu, e quem usa 15 dias e apaga o servidor paga 15 dias, não o mês inteiro. Eles também citaram um período de teste gratuito de três dias. Backup externo e add-ons, como suporte premium, são cobrados à parte."
  - question: "Como migrar um servidor de um provedor de nuvem para outro na Cloudways?"
    answer: "No episódio, os representantes da Cloudways mostram a função de clonar servidor: você escolhe o que levar (configurações, domínios, cron jobs, credenciais, acesso do time) e o provedor de destino, como trocar a DigitalOcean pela AWS. Na mesma tela dá para fazer escala vertical, por exemplo de um servidor standard de 4 GB para um premium de 8 GB."
  - question: "Que ferramentas de monitoramento a Cloudways oferece para Magento?"
    answer: "Segundo Jyoti, o painel da aplicação mostra tráfego, IPs e URLs mais requisitados, tráfego de bots, códigos de status HTTP, páginas PHP lentas, conexões ativas e consultas lentas do MySQL, cron jobs e logs de acesso e erro do Apache, Nginx e PHP. Ivan Augusto lembrou ainda da integração com o New Relic."
---
Neste episódio gravado em inglês, Ivan Augusto, conhecido como CodeSlicer, entrevista pela primeira vez uma empresa em vez de um desenvolvedor: dois representantes da **Cloudways**, plataforma de hospedagem cloud gerenciada. Um deles se apresenta como community manager geral, com cerca de sete anos de marketing digital e quatro de Cloudways; Jyoti, também community manager, conta ter mais de quatro anos de desenvolvimento web, principalmente em projetos de e-commerce com Magento e Laravel.

Eles explicam que a Cloudways surgiu em 2012 para tirar do cliente o trabalho de administrar servidores na nuvem e que foi comprada pela DigitalOcean. Em demonstração ao vivo, Jyoti sobe um Magento 2.4.6 em um clique, e o painel avisa que a versão pede PHP 8.1 e recomenda servidor de 4 GB. A conversa passa pela escolha de provedores (DigitalOcean, Vultr, Linode, AWS e Google Cloud), servidores standard e premium, Varnish e CDN Cloudflare Enterprise, clonagem de servidor entre provedores e a **cobrança por hora**.

Depois vem o tour pelo painel: credenciais SSH, monitoramento de CPU, memória e disco com histórico de até seis meses, whitelist de IP para SSH e MySQL, backups agendados, SMTP, staging, análise de tráfego e de consultas lentas, cron jobs, logs, SSL gratuito, deploy via Git e ajustes de PHP-FPM e Varnish sem linha de comando. Ivan destaca que o episódio não é publicidade paga: Jonatan Machado já tinha usado o serviço e sugeriu a conversa.
