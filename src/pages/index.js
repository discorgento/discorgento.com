import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import { useState } from 'react';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const [isHovered, setIsHovered] = useState(false);

  const buttonComunity = {
    background: isHovered
      ? 'linear-gradient(to left, #EC6737, #743ad5)'
      : 'linear-gradient(to left, #743ad5, #EC6737)',
    color: '#fff',
    border: 0,
    boxShadow: '6px 6px 26px -6px rgba(0,0,0,0.75)',
    transition: 'background 0.5s, color 0.5s, transform 0.5s',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
  };

  return (
    <header style={{ background: 'url("img/bg-website-fhd.png")' }} className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
          className="hero__title"
        >
          <img src="img/logo.svg" style={{ width: '65px', padding: '10px' }} alt="Logo" />
          {siteConfig.title}
        </h1>

        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttonComunity}>
          <a
            href="https://discord.gg/amfwybm3yj"
            className="button button--secondary button--lg"
            style={buttonComunity}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            we want YOU for our community!
          </a>
        </div>
        <div style={{ paddingTop: '10px' }}>
          <iframe src="https://open.spotify.com/embed/show/5h3gKepBezY4Iz5LM79nUn?utm_source=generator&theme=0&t=0" frameBorder="0" allowFullScreen height="152" width="100%"></iframe>

          <iframe src="https://open.spotify.com/embed/playlist/4pU2Abae7J8vdY4yqPCXRc?utm_source=generator&theme=0&t=0" frameBorder="0" allowFullScreen height="400" width="100%"></iframe>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
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
