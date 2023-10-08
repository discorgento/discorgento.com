import Translate, { translate } from '@docusaurus/Translate';
import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

const FeatureList = [
  {
    title: translate({ 
      id: 'theme.podcast.title'
     }),
    Svg: require('@site/static/img/mic_icon.svg').default,
    description: (
      <Translate
        id="theme.podcast.label"
        description="The label for the podcast section"
      />
    ),
  },
  {
    title: translate({ 
      id: 'theme.community.title'
     }),
    Svg: require('@site/static/img/mic_discord.svg').default,
    description: (
      <Translate
        id="theme.community.label"
        description="The label for the community section"
      />
    ),
  },
  {
    title: translate({ 
      id: 'theme.news.title'
     }),
    Svg: require('@site/static/img/mic_megaphone.svg').default,
    description: (
      <Translate
        id="theme.news.label"
        description="The label for the news section"
      />
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
