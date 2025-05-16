import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './styles.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

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
        <div className="buttonCommunity">
          <a
            href="https://discord.gg/amfwybm3yj"
            target="_blank"
            className={clsx("button button--primary button--lg", styles.linkButtonCommunity)}
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

export default HomepageHeader;