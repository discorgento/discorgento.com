---
description: "Raul Sakai explica o que é e-commerce headless e PWA no Magento, quando vale a pena adotar e quanto isso pesa em desenvolvimento, cache e infra."
keyPoints:
  - "Para Raul Sakai, headless significa um front-end rodando totalmente separado do back-end, conversando com ele só por APIs (REST ou GraphQL), e não necessariamente React com GraphQL."
  - "No Magento, o caminho headless mais conhecido é o PWA Studio com o Venia storefront; o PWA engloba o headless e adiciona recursos como service workers e funcionamento offline."
  - "O conselho de Raul é nunca começar um projeto Magento em headless se ele consegue respeitar a estrutura de cache do Varnish (grupo de cliente, store view e URL)."
  - "Segundo ele, migrar para PWA depois que a loja estabilizou custa menos do que começar o projeto do zero em PWA."
  - "Raul estima que um Magento sem Varnish gasta de 40% a 60% a mais de infraestrutura, e que um Varnish bem configurado chega a 70% de cache hit."
  - "No Adobe Commerce Cloud, o deploy de um front headless é só um passo a mais, que compila o front no final do processo."
faq:
  - question: "Qual a diferença entre headless e PWA no Magento?"
    answer: "Segundo Raul Sakai, headless é a arquitetura em que o front-end roda separado do back-end e consome tudo por API. O PWA engloba o headless e acrescenta recursos de app, como instalar o site no celular, service workers e manter o carrinho offline. No Magento, isso aparece como PWA Studio e Venia storefront."
  - question: "Vale a pena começar uma loja Magento já em headless?"
    answer: "Para Raul Sakai, quase nunca: se o projeto consegue respeitar o cache do Magento, ele recomenda começar no monolito. Ele indica headless desde o início em dois cenários: quando sobra dinheiro e tempo, ou quando o negócio precisa de um cache mais granular, como um catálogo B2B com preços calculados fora do Magento."
  - question: "Headless deixa o desenvolvimento no Magento mais lento?"
    answer: "Segundo Raul Sakai, a lógica de back-end muda pouco, mas o tempo aumenta: é preciso criar schema e resolvers GraphQL, documentar para o front e implementar os componentes no Apollo. Os testes também ficam mais difíceis, porque o back-end valida só dados de entrada e saída. Ele já tirou um cliente do PWA e voltou para o monolito por causa da velocidade de desenvolvimento."
  - question: "Headless no Magento é melhor para performance e SEO?"
    answer: "Raul Sakai diz que o front headless é naturalmente mais rápido, porque imprime menos HTML, CSS e JavaScript, mas que APIs e resolvers mal feitos deixam a loja lenta. Sobre SEO, ele afirma que não é mais um problema desde que se sigam as boas práticas, já que o Google executa o JavaScript das páginas."
  - question: "Módulos de terceiros do Magento funcionam no PWA Studio?"
    answer: "Depende do módulo, segundo Raul Sakai. Alguns já entregam o GraphQL e os componentes do Venia, mas ainda é preciso encaixá-los no layout; os que não suportam headless exigem que você estude o módulo e escreva os próprios resolvers e endpoints GraphQL."
---
Raul Sakai, que dá aulas gratuitas de Magento no servidor The IT Nerd, conversa com Jonatan Machado e Maria Ferro sobre **e-commerce headless** e PWA no Magento. Ele separa os conceitos: headless é o front-end rodando separado do back-end, falando só por API; o PWA, como o PWA Studio com o Venia storefront, engloba isso e acrescenta recursos de app. Tecnicamente, diz ele, é melhor que o monolito, mas cobra o preço em processo: schema e resolvers GraphQL, componentes no Apollo, testes mais difíceis e a exigência de back e front funcionarem como um time só.

A recomendação dele é direta: se o projeto consegue respeitar o cache do Varnish, comece no monolito e só migre para PWA quando a loja estiver estável, o que sai mais barato do que nascer em PWA. As exceções são quem tem dinheiro e tempo de sobra e quem precisa de cache mais granular, como um catálogo B2B com preços calculados fora do Magento. Raul também comenta performance, SEO, Page Builder, atualizações major do PWA Studio, o cache do Apollo, custo de infraestrutura e um projeto em que a busca foi ligada direto a um serviço externo, com fila no RabbitMQ, e gerava preços errados no catálogo.

Na parte pessoal, conta que começou a programar aos 12 anos, estudou design em São Paulo, passou pela Dufry no Rio de Janeiro e abriu a unidade de Magento da Infobase, onde o time fez 198 sites para a Dufry em um ano com um único código. Fala ainda dos módulos abertos que desenvolve nas aulas (Core, Brasil, performance e UX) e deixa um conselho: **devs precisam entender mais de negócio**, não só de tecnologia.
