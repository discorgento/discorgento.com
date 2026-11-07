---
description: "Representantes de Cloudways muestran cómo el hosting cloud gestionado instala Magento en un clic y gestiona servidor, caché, backups y cobro por hora."
keyPoints:
  - "Según los representantes de la empresa, Cloudways nació en 2012 como plataforma de hosting cloud gestionado y fue comprada por DigitalOcean."
  - "Cloudways no es un proveedor de nube, sino una capa de gestión: el cliente elige entre proveedores como DigitalOcean, Vultr, Linode, AWS y Google Cloud, siempre con el mismo panel."
  - "En la demostración, al crear un Magento 2.4.6 la plataforma avisó que la versión requiere PHP 8.1 y recomendó un servidor de 4 GB para Magento frente a 2 GB para WordPress."
  - "Un servidor se puede clonar a otro proveedor, por ejemplo de DigitalOcean a AWS, llevando configuraciones, dominios, cron jobs y accesos."
  - "El cobro es pay-as-you-go, calculado por hora: quien usa un servidor 15 días y lo elimina paga solo esos 15 días."
  - "El panel incluye Varnish, CDN Cloudflare Enterprise desde unos 5 dólares, whitelist de IP para SSH y MySQL, backups locales o externos, staging, SSL gratuito y deploy con Git."
faq:
  - question: "¿Qué es Cloudways?"
    answer: "Según los representantes de Cloudways en el episodio, es una plataforma de hosting cloud gestionado creada en 2012 y hoy parte de DigitalOcean. No es un proveedor de nube: gestiona servidores en proveedores como DigitalOcean, Vultr, Linode, AWS y Google Cloud, para que el cliente se concentre en el negocio y no en administrar el servidor."
  - question: "¿Se puede alojar Magento en Cloudways?"
    answer: "Sí. En la demostración de Jyoti, Magento se instala en un clic, sin Composer ni SSH, y la plataforma avisa los requisitos de la versión elegida, como PHP 8.1 para Magento 2.4.6. El tamaño de servidor recomendado para Magento fue de 4 GB, y el panel entrega la URL de la tienda, la URL del admin y las credenciales de la base de datos."
  - question: "¿Cómo funciona el cobro de Cloudways?"
    answer: "Según los representantes de Cloudways, el modelo es pay-as-you-go con cálculo por hora: pagas solo el tiempo que existió el servidor, así que usarlo 15 días y eliminarlo cuesta 15 días, no el mes completo. También mencionaron una prueba gratuita de tres días. El backup externo y los add-ons, como el soporte premium, se cobran aparte."
  - question: "¿Cómo migrar un servidor de un proveedor de nube a otro en Cloudways?"
    answer: "En el episodio, los representantes de Cloudways muestran la función de clonar servidor: eliges qué llevar (configuraciones, dominios, cron jobs, credenciales, acceso del equipo) y el proveedor de destino, por ejemplo pasar de DigitalOcean a AWS. En la misma pantalla se hace el escalado vertical, como pasar de un servidor standard de 4 GB a uno premium de 8 GB."
  - question: "¿Qué herramientas de monitoreo ofrece Cloudways para Magento?"
    answer: "Según Jyoti, el panel de la aplicación muestra tráfico, IPs y URLs más solicitadas, tráfico de bots, códigos de estado HTTP, páginas PHP lentas, conexiones activas y consultas lentas de MySQL, cron jobs y logs de acceso y error de Apache, Nginx y PHP. Ivan Augusto mencionó además la integración con New Relic."
---
En este episodio grabado en inglés, Ivan Augusto, conocido como CodeSlicer, entrevista por primera vez a una empresa en lugar de a un desarrollador: dos representantes de **Cloudways**, plataforma de hosting cloud gestionado. Uno se presenta como community manager general, con unos siete años en marketing digital y cuatro en Cloudways; Jyoti, también community manager, cuenta que tiene más de cuatro años de experiencia en desarrollo web, sobre todo en proyectos de e-commerce con Magento y Laravel.

Explican que Cloudways nació en 2012 para quitarle al cliente el trabajo de administrar servidores en la nube y que fue comprada por DigitalOcean. En una demostración en vivo, Jyoti crea un Magento 2.4.6 en un clic, y el panel avisa que la versión pide PHP 8.1 y recomienda un servidor de 4 GB. La charla pasa por la elección de proveedores (DigitalOcean, Vultr, Linode, AWS y Google Cloud), servidores standard y premium, Varnish y CDN Cloudflare Enterprise, la clonación de servidores entre proveedores y el **cobro por hora**.

Después viene el recorrido por el panel: credenciales SSH, monitoreo de CPU, memoria y disco con historial de hasta seis meses, whitelist de IP para SSH y MySQL, backups programados, SMTP, staging, análisis de tráfico y de consultas lentas, cron jobs, logs, SSL gratuito, deploy con Git y ajustes de PHP-FPM y Varnish sin línea de comandos. Ivan aclara que el episodio no es publicidad pagada: Jonatan Machado ya había usado el servicio y sugirió la conversación.
