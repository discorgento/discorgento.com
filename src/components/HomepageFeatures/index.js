import React from 'react';
import styles from './styles.module.css';
import FeatureList from '@site/src/components/FeatureList';

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <FeatureList />
      </div>
    </section>
  );
}

export default HomepageFeatures;