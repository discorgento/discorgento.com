---
description: "Cómo el módulo discorgento/module-migrations simplifica los data patches de Magento 2 para versionar configuración del admin y páginas CMS en código."
keyPoints:
  - "discorgento/module-migrations simplifica los data patches nativos de Magento 2, que se usan para llevar al código cambios hechos en el admin o en la base de datos."
  - "En lugar de implementar los cuatro métodos obligatorios de las interfaces de un data patch nativo, basta con extender la clase Migration del módulo e implementar un único método obligatorio."
  - "El módulo incluye facades, inspiradas en el concepto de Laravel, para los cambios más comunes, como guardar configuraciones y crear o actualizar páginas CMS."
  - "Cada migration se ejecuta una sola vez en setup:upgrade y queda registrada en la tabla patch_list; borrar ese registro hace que vuelva a ejecutarse en el siguiente upgrade."
  - "El video recomienda mantener las migrations atómicas, un cambio por archivo, porque se ejecutan en orden alfabético en bases de datos desactualizadas."
faq:
  - question: "¿Qué es el módulo discorgento/module-migrations?"
    answer: "Es un módulo open source de discorgento que simplifica los data patches de Magento 2, la forma nativa de escribir migraciones de base de datos. Según el video, permite versionar en código cambios hechos en el admin, como configuraciones y contenido CMS, para que se apliquen automáticamente en otros entornos y en las máquinas de los compañeros."
  - question: "¿Cómo se crea una migration con el módulo Migrations en Magento 2?"
    answer: "El archivo va en la carpeta Setup/Patch/Data del módulo, como cualquier data patch, pero extiende la clase Migration de discorgento e implementa solo el método obligatorio. Dentro, las facades hacen el trabajo: en el ejemplo del video, el método de configuración recibe el path y el valor para cambiar la moneda de la tienda a real brasileño, y también acepta alcance y tienda."
  - question: "¿Una migration de Magento se ejecuta más de una vez?"
    answer: "No. Según el video, la ejecución queda registrada en la tabla patch_list y volver a correr setup:upgrade no ejecuta la misma migration. Durante el desarrollo, borrar su registro de esa tabla hace que se ejecute de nuevo."
  - question: "¿Cómo mantener una página CMS actualizada con migrations?"
    answer: "El video crea una página CMS a partir de su identificador, título, encabezado y contenido, y actualiza el contenido de la home en otra migration. Para cambiar el contenido después, la recomendación es crear una nueva migration, como una V2, en lugar de editar la anterior, ya que se ejecutan en orden alfabético."
  - question: "¿Puedo borrar datos directamente en la base de datos de Magento?"
    answer: "El video lo desaconseja: borrar algo directamente en la base de datos siempre puede dejar efectos secundarios y datos residuales, mientras que borrar desde el admin elimina todo lo relacionado. En el ejemplo, la página borrada a mano en la base dejó restos que el admin habría limpiado."
---
En este video corto, discorgento anuncia oficialmente **discorgento/module-migrations**, un módulo que ya se usaba en producción y se presenta como estable. Como se explica, una migration registra cambios de base de datos en código: en Magento, un cambio hecho en el admin queda en la base local y no llega a otros entornos ni a los compañeros, que tendrían que rehacerlo a mano o importar una base actualizada.

Magento 2 ya resuelve esto con data patches, pero el esqueleto nativo exige cuatro métodos de las interfaces. El módulo lo reduce a extender la clase Migration e implementar un único método, usando **facades** para las tareas más comunes, un concepto que el video compara con el de Laravel. El primer ejemplo cambia la moneda de la tienda a real brasileño con el método de configuración, que recibe el path y el valor y acepta alcance y tienda. La migration se ejecuta en setup:upgrade, queda registrada en la tabla patch_list y no corre dos veces.

El segundo ejemplo crea una página CMS de demostración y la inserta en la home, separando la creación de la página y la actualización de la home en migrations distintas. La regla de oro del video es mantener cada migration atómica, ya que se ejecutan en orden alfabético, y crear una nueva versión para cambiar contenido después. También advierte contra borrar datos directamente en la base y remite a la wiki del módulo, que documenta otras facades, como las de gestión de atributos.
