import React from 'react';
import { USE_LEGACY_INVASION_CONCLUDED_PAGE } from '../config/invasionConcludedConfig';
import InvasionConcludedPageStandby from './InvasionConcludedPage.standby';
import InvasionConcludedPagePlaceholder from './InvasionConcludedPagePlaceholder';

const InvasionConcludedPage: React.FC = () => {
  if (USE_LEGACY_INVASION_CONCLUDED_PAGE) {
    return <InvasionConcludedPageStandby />;
  }

  return <InvasionConcludedPagePlaceholder />;
};

export default InvasionConcludedPage;
