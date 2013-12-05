require 'spec_helper'

describe TerrainRule do
  context 'validating' do
    let(:terrain_rule) { build(:terrain_rule, terrain_rule_params) }
    let(:terrain_rule_params) { {} }

    context 'with the default factory' do
      specify { terrain_rule.should be_valid }
    end

    context 'no block_movement' do
      let(:terrain_rule_params) { {block_movement: nil} }
      specify { terrain_rule.should be_invalid }
    end

    context 'no terrain_type' do
      let(:terrain_rule_params) { {terrain_type: nil} }
      specify { terrain_rule.should be_invalid }
    end

    context 'no variant' do
      let(:terrain_rule_params) { {variant: nil} }
      specify { terrain_rule.should be_invalid }
    end
  end
end
