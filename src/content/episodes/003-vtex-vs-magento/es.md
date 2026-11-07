---
description: "¿VTEX o Magento? Felipe Mendes y Vitor Couto comparan personalización, checkout, Page Builder y Site Editor, y cuentan cómo fue pasar de Magento a VTEX."
keyPoints:
  - "Para Vitor Couto, VTEX tiene una curva de aprendizaje menor que Magento porque su front-end está hecho completamente en React, mientras que Magento usa Knockout."
  - "Felipe Mendes resume la diferencia así: Magento es 100% personalizable, mientras que VTEX es SaaS y mantiene el back-end y los servidores bajo su responsabilidad, sin acceso al código fuente."
  - "En el Page Builder de Magento se pueden arrastrar bloques para armar la página; en VTEX, el cliente solo edita en el Site Editor los bloques de páginas cuya plantilla ya tiene un JSON Schema configurado."
  - "En VTEX no existe un entorno de desarrollo local: todo corre en la nube de la plataforma y, sin internet, no se puede trabajar."
  - "Según Felipe Mendes, el checkout y el área de usuario son las partes más cerradas de VTEX, y personalizar el checkout traslada parte de la responsabilidad por los problemas a quien lo personalizó."
  - "Vitor Couto cuenta que el checkout de VTEX también está hecho en Knockout y que tardó unos tres o cuatro meses en sentirse cómodo sobrescribiendo componentes nativos de la plataforma."
faq:
  - question: "¿VTEX es mejor que Magento?"
    answer: "Según Vitor Couto y Felipe Mendes, depende. Vitor dice que VTEX es más fácil para quien empieza, porque usa React. Felipe afirma que la elección depende de los procesos del cliente: las empresas con muchas reglas y personalizaciones suelen encajar mejor en Magento, que es 100% personalizable, mientras que VTEX es un SaaS con partes cerradas."
  - question: "¿Qué estudiar para pasar de Magento a VTEX?"
    answer: "Vitor Couto recomienda sobre todo React, incluido el manejo de estado, y TypeScript, ya que la propia VTEX escribe sus apps en él. También menciona Sass, fácil de integrar y parecido al Less de Magento, y JSON Schema, que conecta las propiedades de los componentes con lo que el cliente edita en el Site Editor."
  - question: "¿Se puede personalizar el checkout de VTEX?"
    answer: "Sí, con limitaciones. Vitor Couto explica que el checkout de VTEX está hecho en Knockout, sin acceso a esa capa, y que las personalizaciones grandes se hacen con JavaScript y CSS desde el editor del checkout en el panel. Felipe Mendes dice que el checkout y el área de usuario son las partes más cerradas de la plataforma y que personalizarlas puede generar problemas con cada actualización."
  - question: "¿Qué pasa cuando un proyecto VTEX se aleja del estándar recomendado?"
    answer: "Según Felipe Mendes, aparece un bug tras otro: se resuelve un problema y surge otro. Vitor Couto menciona un proyecto que movía elementos en pantalla con JavaScript puro en lugar de sobrescribir componentes React. En ese caso, el equipo recurrió a VTEX Pro, un servicio pago con sesiones con un arquitecto de VTEX y un contacto dedicado para dudas."
  - question: "¿Qué se necesita para empezar a trabajar como Product Owner en e-commerce?"
    answer: "Para Felipe Mendes, el PO tiene que volverse dueño del negocio: entender los procesos y objetivos del cliente, como los OKR de tres meses, y convertirlos en tareas tácticas. También recomienda conocer la estructura de la plataforma para explicar a los stakeholders qué es posible y estimar el mejor y el peor escenario."
---
En el tercer episodio, Jonatan Machado y Maria Ferro conversan con Felipe Mendes y Vitor Couto, que trabajan juntos en una agencia de e-commerce. Vitor tiene alrededor de un año implementando tiendas VTEX y antes trabajaba con Magento; Felipe es Product Owner, ingeniero de producción, y empezó en la agencia dando soporte a tiendas Magento 2.

Sobre **VTEX vs Magento**, la respuesta de ambos es "depende". Vitor destaca el front-end en React, la estructura de páginas armada en JSON, las apps de back-end en Node y la falta de un entorno local, ya que todo corre en la nube de VTEX; confía en que FastStore cambie eso. Felipe compara el SaaS de VTEX con la libertad total de Magento y el Page Builder con el Site Editor, y explica por qué frena muchas personalizaciones del checkout y del área de usuario. A Maria Ferro le parece anticuado el registro de productos y SKU en el panel, hecho página por página. También aparecen la barra de envío gratis, un pedido común que da trabajo en VTEX, un enorme diagrama de flujo de Avon presentado en un evento de VTEX y el servicio pago VTEX Pro.

La segunda parte habla de carrera y salud mental. Vitor empezó como pasante en la versión antigua de VTEX, pasó por Magento en una empresa de turismo y hoy quiere trabajar en un producto. Felipe cuenta cómo la empresa adoptó metodologías ágiles, el "guion de desarrollo" que hizo más precisas las estimaciones y la oficina virtual en Gather. Sobre la ansiedad, Vitor camina y corre con su perro, y Felipe volvió a cansar el cuerpo con natación, lucha, skate y carrera después de una crisis. Sus consejos a su yo del pasado: **ir con calma**, no querer abarcarlo todo y no tener miedo a equivocarse.
