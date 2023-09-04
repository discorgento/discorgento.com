import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header style={{background: 'url("img/bg-website-fhd.png")'}} className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 style={{display: 'flex', justifyContent: 'center'}} className="hero__title">
          <img src="img/logo.svg" style={{width: '65px', padding: '10px'}}></img> 
          {siteConfig.title}
        </h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="https://discord.gg/amfwybm3yj">
            we want YOU for our community!
          </Link>
        </div>
        <div style={{paddingTop: '10px'}}>
          <iframe src="https://open.spotify.com/embed/show/5h3gKepBezY4Iz5LM79nUn?utm_source=generator&theme=0&t=0" frameBorder="0" allowFullScreen height="152" width="100%"></iframe>

          <iframe src="https://open.spotify.com/embed/playlist/4pU2Abae7J8vdY4yqPCXRc?utm_source=generator&theme=0&t=0" frameBorder="0" allowFullScreen height="400" width="100%"></iframe>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | Podcast`}
      description="Podcast - Tech Community on Discord (Magento, JS, PHP, MySQL, React, Vue) we want YOU for our community!">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
