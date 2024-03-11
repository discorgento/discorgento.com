---
title: '2 Diferenças metodos Dispatch() around, before, after'
description: 'About magento 2 plugin methods'
authors: ['mary']
pubDate: 'Sep 03 2023'
tags: ['magento', 'dispatch']
heroImage: '/blog-placeholder-about.jpg'
---

Ao comparar o método aroundDispatch() com os métodos beforeDispatch() e afterDispatch() em termos de desempenho, o método aroundDispatch() é geralmente o que pode ter um impacto ligeiramente maior no desempenho, principalmente por causa da chamada adicional ao $proceed(). No entanto, é importante notar que a diferença no desempenho entre eles também é geralmente insignificante e provavelmente não será perceptível na maioria dos casos.

A diferença entre os três métodos é mais relacionada ao comportamento que você deseja adicionar ao seu plugin:

aroundDispatch(): Com o aroundDispatch(), você pode executar lógica antes e/ou depois da ação original, e você também tem a capacidade de modificar o resultado da ação original se necessário. Essa flexibilidade torna o aroundDispatch() muito poderoso, mas também pode tornar o código mais complexo de implementar corretamente.

beforeDispatch(): O beforeDispatch() é adequado quando você precisa realizar ações antes da execução da ação original. Ele permite preparar o ambiente, configurar valores ou verificar condições antes que a ação original seja executada.

afterDispatch(): O afterDispatch() é adequado quando você precisa realizar ações após a execução da ação original. Ele permite executar lógica com base no resultado retornado pela ação original ou realizar tarefas adicionais após a conclusão da ação.

Se a lógica que você deseja adicionar ao plugin requer manipulação tanto antes quanto após a execução da ação original, o aroundDispatch() é uma escolha natural. Se a lógica que você deseja adicionar é estritamente antes ou após a execução da ação original, você pode optar pelo método correspondente (beforeDispatch() ou afterDispatch()) para tornar o código mais claro e conciso.

Em geral, a diferença de desempenho entre esses métodos é pequena e não deve ser o principal fator para determinar qual usar. A escolha deve ser orientada pela funcionalidade desejada, legibilidade e manutenibilidade do código. Seu objetivo deve ser escrever código claro e eficiente, que atenda às necessidades específicas do seu módulo e da aplicação como um todo.
