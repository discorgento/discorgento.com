import React from 'react';
import styles from './styles.module.css';

function FeatureItem({ title, Svg, description }) {
  return (
    <div className="col col--4">
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

export default FeatureItem;