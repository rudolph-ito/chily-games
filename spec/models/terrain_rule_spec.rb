require 'spec_helper'

describe TerrainRule do
  let(:terrain_rule) { build :terrain_rule, terrain_rule_params }
  let(:terrain_rule_params) { {} }

  context 'validating' do
    context 'with the default factory' do
      specify { expect(terrain_rule).to be_valid }
    end

    context 'no terrain_type' do
      let(:terrain_rule_params) { {terrain_type: nil} }
      specify { expect(terrain_rule).to be_invalid }
    end

    context 'no variant' do
      let(:terrain_rule_params) { {variant: nil} }
      specify { expect(terrain_rule).to be_invalid }
    end

    context 'no count' do
      let(:terrain_rule_params) { {count: nil} }
      specify { expect(terrain_rule).to be_invalid }
    end

    context 'count is <= 0' do
      let(:terrain_rule_params) { {count: 0} }
      specify { expect(terrain_rule).to be_invalid }
    end

    context 'no passable_movement_effect_type' do
      let(:terrain_rule_params) { {passable_movement_effect_type: nil} }
      specify { expect(terrain_rule).to be_invalid }
    end

    context 'no stops_movement_effect_type' do
      let(:terrain_rule_params) { {stops_movement_effect_type: nil} }
      specify { expect(terrain_rule).to be_invalid }
    end

    context 'no slows_movement_effect_type' do
      let(:terrain_rule_params) { {slows_movement_effect_type: nil} }
      specify { expect(terrain_rule).to be_invalid }
    end

    context 'no passable_range_effect_type' do
      let(:terrain_rule_params) { {passable_range_effect_type: nil} }
      specify { expect(terrain_rule).to be_invalid }
    end
  end

  describe '#rule_descriptions' do
    before do
      Messages.stub(:effect_description).and_return('who')
    end

    context 'no passable movement' do
      let(:terrain_rule_params) { { passable_movement_effect_type: 'none' } }

      it 'returns descriptions for passable movement and range' do
        expect(terrain_rule.rule_descriptions).to eql [
          'who can move through / over',
          'who can range capture through / over'
        ]
      end
    end

    context 'with passable movement' do
      let(:terrain_rule_params) { { passable_movement_effect_type: 'all' } }

      context 'with slows movement' do
        before do
          terrain_rule_params.merge!(slows_movement_effect_type: 'all', slows_movement_by: 1)
        end

        it 'add descriptions for slows movement' do
          expect(terrain_rule.rule_descriptions).to eql [
            'who can move through / over',
            'slows movement for who by 1',
            'who can range capture through / over'
          ]
        end
      end

      context 'with stops movement' do
        before do
          terrain_rule_params.merge!(stops_movement_effect_type: 'all')
        end

        it 'add descriptions for stops movement' do
          expect(terrain_rule.rule_descriptions).to eql [
            'who can move through / over',
            'stops movement for who',
            'who can range capture through / over'
          ]
        end
      end
    end
  end

  context '#passable?' do
    context 'movement' do
      context 'when effects returns true' do
        before { terrain_rule.stub(:effects?).with('passable_movement', 1).and_return(true) }

        it 'returns true' do
          expect(terrain_rule.passable?('movement', 1)).to be_true
        end
      end

      context 'when effects returns false' do
        before { terrain_rule.stub(:effects?).with('passable_movement', 1).and_return(false) }

        it 'returns true' do
          expect(terrain_rule.passable?('movement', 1)).to be_false
        end
      end
    end

    context 'range' do
      context 'when effects returns true' do
        before { terrain_rule.stub(:effects?).with('passable_range', 1).and_return(true) }

        it 'returns true' do
          expect(terrain_rule.passable?('range', 1)).to be_true
        end
      end

      context 'when effects returns false' do
        before { terrain_rule.stub(:effects?).with('passable_range', 1).and_return(false) }

        it 'returns true' do
          expect(terrain_rule.passable?('range', 1)).to be_false
        end
      end
    end
  end

  context '#stoppable?' do
    context 'movement' do
      context 'when passable? returns true' do
        before { terrain_rule.stub(:passable?).with('movement', 1).and_return(true) }

        it 'returns true' do
          expect(terrain_rule.stoppable?('movement', 1)).to be_true
        end
      end

      context 'when passable? returns false' do
        before { terrain_rule.stub(:passable?).with('movement', 1).and_return(false) }

        it 'returns true' do
          expect(terrain_rule.stoppable?('movement', 1)).to be_false
        end
      end
    end

    context 'range' do
      it 'returns true' do
        expect(terrain_rule.stoppable?('range', 1)).to be_true
      end
    end
  end

  context '#slows?' do
    context 'movement' do
      context 'when effects returns true' do
        before { terrain_rule.stub(:effects?).with('slows_movement', 1).and_return(true) }

        it 'returns true' do
          expect(terrain_rule.slows?('movement', 1)).to be_true
        end
      end

      context 'when effects returns false' do
        before { terrain_rule.stub(:effects?).with('slows_movement', 1).and_return(false) }

        it 'returns true' do
          expect(terrain_rule.slows?('movement', 1)).to be_false
        end
      end
    end

    context 'range' do
      it 'returns false' do
        expect(terrain_rule.slows?('range', 1)).to be_false
      end
    end
  end

  context '#slows_by' do
    let(:terrain_rule_params) { {slows_movement_by: 1} }

    context 'movement' do
      it 'returns slows_movement_by' do
        expect(terrain_rule.slows_by('movement')).to eql 1
      end
    end

    context 'range' do
      it 'returns 0' do
        expect(terrain_rule.slows_by('range')).to eql 0
      end
    end
  end

  context '#stops?' do
    context 'movement' do
      context 'when effects returns true' do
        before { terrain_rule.stub(:effects?).with('stops_movement', 1).and_return(true) }

        it 'returns true' do
          expect(terrain_rule.stops?('movement', 1)).to be_true
        end
      end

      context 'when effects returns false' do
        before { terrain_rule.stub(:effects?).with('stops_movement', 1).and_return(false) }

        it 'returns true' do
          expect(terrain_rule.stops?('movement', 1)).to be_false
        end
      end
    end

    context 'range' do
      it 'returns false' do
        expect(terrain_rule.stops?('range', 1)).to be_false
      end
    end
  end

  describe '#effects?' do
    let(:piece_type_id) { 1 }

    context 'invalid effect type' do
      let(:type) { :slows_range }

      it 'returns false' do
        expect(terrain_rule.effects?(type, piece_type_id)).to be_false
      end
    end

    context 'valid effect type' do
      let(:type) { :passable_movement }

      context "effect_type == none" do
        before { terrain_rule["#{type}_effect_type"] = 'none' }
        it 'returns false' do
          expect(terrain_rule.effects?(type, piece_type_id)).to be_false
        end
      end

      context "effect_type == all" do
        before { terrain_rule["#{type}_effect_type"] = 'all' }
        it 'returns true' do
          expect(terrain_rule.effects?(type, piece_type_id)).to be_true
        end
      end

      context "effect_type == include" do
        before { terrain_rule["#{type}_effect_type"] = 'include' }

        context 'piece_type_id included' do
          before { terrain_rule["#{type}_effect_piece_type_ids"] = [piece_type_id.to_s] }
          it 'returns true' do
            expect(terrain_rule.effects?(type, piece_type_id)).to be_true
          end
        end

        context 'piece_type_id not included' do
          before { terrain_rule["#{type}_effect_piece_type_ids"] = [] }
          it 'returns false' do
            expect(terrain_rule.effects?(type, piece_type_id)).to be_false
          end
        end
      end

      context "effect_type == exclude" do
        before { terrain_rule["#{type}_effect_type"] = 'exclude' }

        context 'piece_type_id included' do
          before { terrain_rule["#{type}_effect_piece_type_ids"] = [piece_type_id.to_s] }
          it 'returns false' do
            expect(terrain_rule.effects?(type, piece_type_id)).to be_false
          end
        end

        context 'piece_type_id not included' do
          before { terrain_rule["#{type}_effect_piece_type_ids"] = [] }
          it 'returns true' do
            expect(terrain_rule.effects?(type, piece_type_id)).to be_true
          end
        end
      end
    end
  end
end
