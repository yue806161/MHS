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
  backgrounds: any;
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

  private initTraits(traits: { [key: string]: Trait }): {
    [key: string]: number;
  } {
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

  private getRandomBackground(backgrounds: any): any {
    let randomBackground = {};
    for (const category in backgrounds) {
      const categoryItems = backgrounds[category];
      if (!categoryItems || Object.keys(categoryItems).length === 0) {
        console.error(`No items found for background category '${category}'`);
        continue;
      }
      const itemKeys = Object.keys(categoryItems);
      const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
      randomBackground[category] = categoryItems[randomKey];
      console.log(
        `Selected background for '${category}': '${randomBackground[category].name}'`
      );
    }
    return randomBackground;
  }

  private getRandomPersonalities(
    personalities: { [key: string]: Personality },
    min: number,
    max: number
  ): Personality[] {
    if (Object.keys(personalities).length === 0) {
      console.error("Personalities object is empty or undefined.");
      return [];
    }

    let availablePersonalities = Object.keys(personalities).map(
      (key) => personalities[key]
    );
    let chosenPersonalities: Personality[] = [];
    const count = Math.floor(Math.random() * (max - min + 1) + min);

    while (
      chosenPersonalities.length < count &&
      availablePersonalities.length > 0
    ) {
      const randomIndex = Math.floor(
        Math.random() * availablePersonalities.length
      );
      const chosenPersonality = availablePersonalities[randomIndex];

      if (!this.isExclusive(chosenPersonality, chosenPersonalities)) {
        chosenPersonalities.push(chosenPersonality);
        // Immediately remove the chosen personality from the pool to avoid re-checking its exclusivity
        availablePersonalities.splice(randomIndex, 1);
      }
    }

    return chosenPersonalities;
  }

  private isExclusive(
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

  private applyEffects(
    traits: { [key: string]: number },
    background: any,
    personalities: Personality[]
  ) {
    // Apply background effects to traits
    Object.keys(background).forEach((bgCategory) => {
      const bgEffects = background[bgCategory].effects;
      Object.keys(bgEffects).forEach((effect) => {
        if (traits.hasOwnProperty(effect)) {
          traits[effect] += bgEffects[effect];
        }
      });
    });

    // Apply personality effects to traits
    personalities.forEach((personality) => {
      Object.keys(personality.effects).forEach((effect) => {
        if (traits.hasOwnProperty(effect)) {
          traits[effect] += personality.effects[effect];
        }
      });
    });
  }
}
