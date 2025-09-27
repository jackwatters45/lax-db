import {
  RiDropFill,
  RiNavigationFill,
  RiPieChartFill,
  RiRobot3Fill,
} from '@remixicon/react';
import { Divider } from '../Divider';
import AnalyticsIllustration from './AnalyticsIllustration';
import { StickerCard } from './StickerCard';

export function SolarAnalytics() {
  return (
    <section
      aria-labelledby="solar-analytics"
      className="relative mx-auto w-full max-w-6xl overflow-hidden"
    >
      <div>
        <h2
          id="solar-analytics"
          className="relative scroll-my-24 font-semibold text-lg text-orange-500 tracking-tight"
        >
          Solar Analytics
          <div className="-left-[8px] absolute top-1 h-5 w-[3px] rounded-r-sm bg-orange-500" />
        </h2>
        <p className="mt-2 max-w-lg text-balance font-semibold text-3xl text-gray-900 tracking-tighter md:text-4xl">
          Turn field data into profitable harvests with real-time insights
        </p>
      </div>
      <div className="*:pointer-events-none">
        <AnalyticsIllustration />
      </div>
      <Divider className="mt-0" />
      <div className="grid grid-cols-1 grid-rows-2 gap-6 md:grid-cols-4 md:grid-rows-1">
        <StickerCard
          Icon={RiNavigationFill}
          title="Autonomous Navigation"
          description="Smart tractors that navigate fields independently using GPS."
        />
        <StickerCard
          Icon={RiRobot3Fill}
          title="Robotic Harvesting"
          description="AI-powered robots that identify and harvest crops at optimal ripeness."
        />
        <StickerCard
          Icon={RiDropFill}
          title="Smart Irrigation"
          description="Automated irrigation systems that optimize water usage."
        />
        <StickerCard
          Icon={RiPieChartFill}
          title="Yield Analytics"
          description="Advanced analytics platform that predicts crop yields."
        />
      </div>
    </section>
  );
}
