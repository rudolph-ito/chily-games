require 'spec_helper'

describe TerrainRuleDecorator do
  let(:decorator) { TerrainRuleDecorator.new(terrain_rule) }
  let(:terrain_rule) { double :terrain_rule,
    passable_movement_effect_type: passable_movement_effect_type,
    passable_range_effect_type: passable_range_effect_type,
    slows_movement_effect_type: slows_movement_effect_type,
    slows_movement_by: slows_movement_by,
    stops_movement_effect_type: stops_movement_effect_type
  }

  let(:passable_movement_effect_type) { 'none' }
  let(:passable_range_effect_type) { 'none' }
  let(:slows_movement_effect_type) { 'none' }
  let(:slows_movement_by) { 1 }
  let(:stops_movement_effect_type) { 'none' }

  describe '#rule_descriptions' do
    before do
      Messages.stub(:effect_description).and_return('who')
    end

    context 'no passable movement' do
      let(:passable_movement_effect_type) { 'none' }

      it 'does not have slows / stops descriptions' do
        expect(decorator.rule_descriptions).to eql [
          'who can move through / over',
          'who can range capture through / over'
        ]
      end
    end

    context 'with passable movement' do
      let(:passable_movement_effect_type) { 'all' }

      context 'with slows movement' do
        let(:slows_movement_effect_type) { 'all' }
        let(:slows_movement_by) { 3 }

        it 'add descriptions for slows movement' do
          expect(decorator.rule_descriptions).to eql [
            'who can move through / over',
            'slows movement for who by 3',
            'who can range capture through / over'
          ]
        end
      end

      context 'with stops movement' do
        let(:stops_movement_effect_type) { 'all' }

        it 'add descriptions for stops movement' do
          expect(decorator.rule_descriptions).to eql [
            'who can move through / over',
            'stops movement for who',
            'who can range capture through / over'
          ]
        end
      end
    end
  end
end
