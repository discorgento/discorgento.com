import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Podcast',
    Svg: require('@site/static/img/mic_icon.svg').default,
    description: (
      <>
        Apresentamos um podcast  que aborda temas essenciais do mundo da tecnologia, sempre com convidados especiais.
      </>
    ),
  },
  {
    title: 'Comunidade',
    Svg: require('@site/static/img/mic_discord.svg').default,
    description: (
      <>
        Junte-se a nós para obter respostas às suas perguntas e colaborar com outros apaixonados por conhecimento. Nossa comunidade está aqui para que todos possam aprender e compartilhar suas experiências. Não hesite, faça parte!
      </>
    ),
  },
  {
    title: 'Notícias',
    Svg: require('@site/static/img/mic_megaphone.svg').default,
    description: (
      <>
        Fique atualizado, dev! Junte-se a nós para se manter sempre atualizado com as mais recentes notícias de tecnologia.
      </>
    ),
  },
];



function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
