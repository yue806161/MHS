import { _decorator, Component, JsonAsset } from "cc";
const { ccclass, property } = _decorator;

interface TraitEffect {
  [key: string]: number;
}

interface Trait {
  name: string;
  range: [number, number];
  weight: number;
}

interface Personality {
  id: string;
  name: string;
  effects: TraitEffect;
  exclusiveWith?: string[];
}

interface CharacterTemplate {
  traits: { [key: string]: Trait };
  backgrounds: {
    education: { [key: string]: { name: string; effects: TraitEffect } };
    family: { [key: string]: { name: string; effects: TraitEffect } };
    workExperience: { [key: string]: { name: string; effects: TraitEffect } };
  };
  personalities: { [key: string]: Personality };
}

@ccclass("CharacterGenerator")
export class CharacterGenerator extends Component {
  @property(JsonAsset)
  characterTemplateJson: JsonAsset = null;

  private characterTemplate: CharacterTemplate;

  onLoad() {
    if (this.characterTemplateJson && this.characterTemplateJson.json) {
      this.characterTemplate =
        this.characterTemplateJson.json.characterTemplate;
      console.log("Character template loaded:", this.characterTemplate);
      if (!this.characterTemplate.personalities) {
        console.error("Personalities object is empty or undefined.");
      }
    } else {
      console.error(
        "Character template JSON is not loaded or is not in the expected format."
      );
    }
  }

  start() {
    const character = this.generateCharacter();
    console.log(character);
  }

  generateCharacter() {
    const traits = this.initTraits(this.characterTemplate.traits);

    const background = this.getRandomBackground(
      this.characterTemplate.backgrounds
    );

    const personalities = this.getRandomPersonalities(
      this.characterTemplate.personalities,
      1,
      3
    );

    this.applyEffects(traits, background, personalities);

    return {
      traits: traits,
      background: background,
      personalities: personalities,
    };
  }

  initTraits(traits: { [key: string]: Trait }): { [key: string]: number } {
    let initializedTraits: { [key: string]: number } = {};
    for (const traitKey in traits) {
      const trait = traits[traitKey];
      const value =
        Math.round(Math.random() * (trait.range[1] - trait.range[0] + 1)) +
        trait.range[0];
      initializedTraits[traitKey] = Math.round(value * trait.weight);
      console.log(
        `Initialized trait '${trait.name}' with weighted value: ${initializedTraits[traitKey]}`
      );
    }
    return initializedTraits;
  }

  getRandomBackground(backgrounds: {
    [key: string]: { [key: string]: { name: string; effects: TraitEffect } };
  }) {
    let randomBackground = {};
    for (const category in backgrounds) {
      const categoryItems = backgrounds[category];
      const itemKeys = Object.keys(categoryItems);
      const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
      if (!categoryItems || Object.keys(categoryItems).length === 0) {
        console.error(`No items found for background category '${category}'`);
        continue;
      }
      randomBackground[category] = categoryItems[randomKey];
      console.log(
        `Selected background for '${category}': '${randomBackground[category].name}'`
      );
    }
    return randomBackground;
  }

  getRandomPersonalities(
    personalities: { [key: string]: Personality },
    min: number,
    max: number
  ) {
    if (!personalities || Object.keys(personalities).length === 0) {
      console.error("Personalities object is empty or undefined.");
      return []; // 返回一个空数组，避免进一步的错误
    }

    let chosenPersonalities: Personality[] = [];
    let availablePersonalitiesKeys = Object.keys(personalities);
    const count = Math.min(
      Math.floor(Math.random() * (max - min + 1) + min),
      availablePersonalitiesKeys.length
    );

    while (
      chosenPersonalities.length < count &&
      availablePersonalitiesKeys.length > 0
    ) {
      const randomIndex = Math.floor(
        Math.random() * availablePersonalitiesKeys.length
      );
      const chosenPersonalityKey = availablePersonalitiesKeys[randomIndex];
      const chosenPersonality = personalities[chosenPersonalityKey];

      if (!this.isExclusive(chosenPersonality, chosenPersonalities)) {
        chosenPersonalities.push(chosenPersonality);
        console.log(`Selected personality: '${chosenPersonality.name}'`);
      }

      availablePersonalitiesKeys.splice(randomIndex, 1);
    }
    return chosenPersonalities;
  }

  isExclusive(
    newPersonality: Personality,
    chosenPersonalities: Personality[]
  ): boolean {
    return chosenPersonalities.some((p) => {
      const isExclusiveWithCurrent =
        p.exclusiveWith && p.exclusiveWith.indexOf(newPersonality.id) !== -1;
      const isCurrentExclusiveWithNew =
        newPersonality.exclusiveWith &&
        newPersonality.exclusiveWith.indexOf(p.id) !== -1;
      return isExclusiveWithCurrent || isCurrentExclusiveWithNew;
    });
  }

  applyEffects(
    traits: { [key: string]: number },
    background: any,
    personalities: Personality[]
  ) {
    // Apply background effects to traits
    for (const bgCategory in background) {
      const bgEffects = background[bgCategory].effects;
      for (const effect in bgEffects) {
        if (traits.hasOwnProperty(effect)) {
          traits[effect] += bgEffects[effect];
          console.log(
            `Applied background effect on ${effect}: +${bgEffects[effect]}`
          );
        }
      }
    }

    // Apply personality effects to traits
    personalities.forEach((personality) => {
      for (const effect in personality.effects) {
        if (traits.hasOwnProperty(effect)) {
          traits[effect] += personality.effects[effect];
          console.log(
            `Applied personality effect from ${personality.name} on ${effect}: +${personality.effects[effect]}`
          );
        }
      }
    });
  }
}
