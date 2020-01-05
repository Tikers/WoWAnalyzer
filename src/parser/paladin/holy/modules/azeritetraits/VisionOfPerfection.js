import React from 'react';
import Analyzer, {SELECTED_PLAYER} from 'parser/core/Analyzer';
import { formatNumber } from 'common/format';
import SPELLS from 'common/SPELLS/index';
import SpellLink from 'common/SpellLink';
import { calculateAzeriteEffects, calculateSecondaryStatDefault } from 'common/stats';

import Events from 'parser/core/Events';
import EventsIcon from 'interface/icons/Events';
import StatIcon from 'interface/icons/PrimaryStat';
import StatisticGroup from 'interface/statistics/StatisticGroup';
import ItemStatistic from 'interface/statistics/ItemStatistic';
import STATISTIC_CATEGORY from 'interface/others/STATISTIC_CATEGORY';
import StatTracker from 'parser/shared/modules/StatTracker';


const BASE_WINGS_DURATION = 20;

/**
 * Vision of Perfection
 * Major: Your spells and abilities have a chance to activate Avenging Wrath for 35% of its base duration.
 * Minor: When the Vision of Perfection activates, you and up to 2 other nearby allies gain 2 Haste for 10 sec.
 * Example Log: https://www.warcraftlogs.com/reports/NXkDdR1LnhAcPabq#fight=12&type=auras&source=3
 */
class VisionOfPerfection extends Analyzer {
  static dependencies = { 
    statTracker: StatTracker,
  };

  casts = 0;
  procs = 0;
  extendedBy = 0;
  avengingWrathDuration = BASE_WINGS_DURATION;

  constructor(...args) {
    super(...args);
    this.active = this.selectedCombatant.hasEssence(SPELLS.VISION_OF_PERFECTION.traitId);
    if (!this.active) {
      return;
    }

    this.addEventListener(Events.applybuff.by(SELECTED_PLAYER).spell(SPELLS.VISION_OF_PERFECTION_HASTE_BUFF_SELF), this.onVisionProc);

    if(this.selectedCombatant.hasTrait(SPELLS.LIGHTS_DECREE.id)){
        this.avengingWrathDuration += 5;
    }

    if(this.selectedCombatant.hasTalent(SPELLS.SANCTIFIED_WRATH_TALENT.id)){
        this.avengingWrathDuration += this.avengingWrathDuration * 0.25;
    }

    this.hasMajor = this.selectedCombatant.hasMajor(SPELLS.VISION_OF_PERFECTION.traitId);
    if (this.hasMajor){
        this.majorHaste = calculateAzeriteEffects(SPELLS.VISION_OF_PERFECTION_HASTE_CALC.id, this.selectedCombatant.neck.itemLevel)[0];
        this.statTracker.add(SPELLS.VISION_OF_PERFECTION_HASTE_BUFF_SELF.id, {
            haste: this.majorHaste,
          });
    }

    this.minorVersatility = calculateSecondaryStatDefault(420,45,this.selectedCombatant.neck.itemLevel);
    this.statTracker.add(SPELLS.VISION_OF_PERFECTION.traitId, {
        versitility: this.minorVersatility,
    });
}

onVisionProc(event){
    this.procs += 1;
}

get visionHasteBuff(){
    const uptime = this.selectedCombatant.getBuffUptime(SPELLS.VISION_OF_PERFECTION_HASTE_BUFF_SELF.id);
    return this.majorHaste * (uptime / this.owner.fightDuration);
}

statistic() {
    const rank = this.selectedCombatant.essenceRank(SPELLS.VISION_OF_PERFECTION.traitId);
    return (
      <StatisticGroup category={STATISTIC_CATEGORY.ITEMS}>
        <ItemStatistic
          ultrawide
          size="flexible"
        >
          <div className="pad">
            <label><SpellLink id={SPELLS.STRIVE_FOR_PERFECTION.id} /> - Minor Rank {rank}</label>
            <div className="value">
              <StatIcon stat={"haste"} /> {(this.majorHaste)} <small>average hasted gained</small><br />
              {rank > 2 && (<><StatIcon stat={"versatility"} /> {formatNumber(this.minorVersatility)} <small>Versatility gained</small><br /></>)}
            </div>
          </div>
        </ItemStatistic>
        {this.hasMajor && (
          <ItemStatistic
            ultrawide
            size="flexible"
          >
            <div className="pad">
              <label><SpellLink id={SPELLS.VISION_OF_PERFECTION.id} /> - Major Rank {rank}</label>
              <div className="value">
                <EventsIcon /> {this.procs} <small>procs</small><br />
                {rank > 2 && (<><StatIcon stat={"haste"} /> {formatNumber(this.visionHasteBuff)} <small>average Haste gained</small><br /></>)}
              </div>
            </div>
          </ItemStatistic>
        )}
      </StatisticGroup>
    );
  }
}

export default VisionOfPerfection;
