import React from 'react';
import Svg, { Path } from 'react-native-svg';

const MiniSparkline = ({ isNegative }) => {
  const strokeColor = isNegative ? '#EF4444' : '#10B981';
  
  // High-fidelity smooth quadratic bezier curves for visual aesthetics
  const pathData = isNegative 
    ? "M 5,5 Q 20,25 35,10 T 65,25" // Sloping downward
    : "M 5,25 Q 20,5 35,18 T 65,5"; // Sloping upward

  return (
    <Svg width="70" height="30" viewBox="0 0 70 30">
      <Path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default MiniSparkline;
