require 'spec_helper'

describe TerrainRule do
  context 'validating' do
    let(:terrain_rule) { build(:terrain_rule, terrain_rule_params) }
    let(:terrain_rule_params) { {} }

    context 'with the default factory' do
      specify { terrain_rule.should be_valid }
    end

    context 'no terrain_type' do
      let(:terrain_rule_params) { {terrain_type: nil} }
      specify { terrain_rule.should be_invalid }
    end

    context 'no variant' do
      let(:terrain_rule_params) { {variant: nil} }
      specify { terrain_rule.should be_invalid }
    end

    context 'no count' do
      let(:terrain_rule_params) { {count: nil} }
      specify { terrain_rule.should be_invalid }
    end

    context 'count is <= 0' do
      let(:terrain_rule_params) { {count: 0} }
      specify { terrain_rule.should be_invalid }
    end

    context 'no block_movement_type' do
      let(:terrain_rule_params) { {block_movement_type: nil} }
      specify { terrain_rule.should be_invalid }
    end

    context 'no block_range_type' do
      let(:terrain_rule_params) { {block_range_type: nil} }
      specify { terrain_rule.should be_invalid }
    end
  end

  context 'block_movement_description' do
    let(:terrain_rule) { TerrainRule.new }

    context 'block_movement_type == none' do
      before { terrain_rule.block_movement_type = 'none' }

      it 'returns nil' do
        expect(terrain_rule.block_movement_description).to be_nil
      end
    end

    context 'block_movement_type == all' do
      before { terrain_rule.block_movement_type = 'all' }

      it 'returns descriptive string' do
        expect(terrain_rule.block_movement_description).to eql 'blocks movement for all pieces'
      end
    end

    context 'block_movement_type == include' do
      before do
        terrain_rule.block_movement_type = 'include'
        terrain_rule.block_movement_piece_type_ids = ['1']
        PieceType.stub(:find).and_return{ double :piece_type, name: 'PieceType1' }
      end

      it 'returns descriptive string' do
        expect(terrain_rule.block_movement_description).to eql 'blocks movement for PieceType1'
      end
    end

    context 'block_movement_type == exclude' do
      before do
        terrain_rule.block_movement_type = 'exclude'
        terrain_rule.block_movement_piece_type_ids = ['1']
        PieceType.stub(:find).and_return{ double :piece_type, name: 'PieceType1' }
      end

      it 'returns descriptive string' do
        expect(terrain_rule.block_movement_description).to eql 'blocks movement for all pieces except PieceType1'
      end
    end
  end

  context 'block_range_description' do
    let(:terrain_rule) { TerrainRule.new }

    context 'block_range_type == none' do
      before { terrain_rule.block_range_type = 'none' }

      it 'returns nil' do
        expect(terrain_rule.block_range_description).to be_nil
      end
    end

    context 'block_range_type == all' do
      before { terrain_rule.block_range_type = 'all' }

      it 'returns descriptive string' do
        expect(terrain_rule.block_range_description).to eql 'blocks range for all pieces'
      end
    end

    context 'block_range_type == include' do
      before do
        terrain_rule.block_range_type = 'include'
        terrain_rule.block_range_piece_type_ids = ['1']
        PieceType.stub(:find).and_return{ double :piece_type, name: 'PieceType1' }
      end

      it 'returns descriptive string' do
        expect(terrain_rule.block_range_description).to eql 'blocks range for PieceType1'
      end
    end

    context 'block_range_type == exclude' do
      before do
        terrain_rule.block_range_type = 'exclude'
        terrain_rule.block_range_piece_type_ids = ['1']
        PieceType.stub(:find).and_return{ double :piece_type, name: 'PieceType1' }
      end

      it 'returns descriptive string' do
        expect(terrain_rule.block_range_description).to eql 'blocks range for all pieces except PieceType1'
      end
    end
  end

  context '#block?' do
    let(:terrain_rule) { TerrainRule.new }
    let(:piece_type_id) { 1 }

    ['movement', 'range'].each do |type|
      context "#{type}" do
        context "block_#{type}_type == none" do
          before { terrain_rule["block_#{type}_type"] = 'none' }
          it 'returns false' do
            expect(terrain_rule.block?(type, piece_type_id)).to be_false
          end
        end

        context "block_#{type}_type == all" do
          before { terrain_rule["block_#{type}_type"] = 'all' }
          it 'returns true' do
            expect(terrain_rule.block?(type, piece_type_id)).to be_true
          end
        end

        context "block_#{type}_type == include" do
          before { terrain_rule["block_#{type}_type"] = 'include' }

          context 'piece_type_id included' do
            before { terrain_rule["block_#{type}_piece_type_ids"] = [piece_type_id.to_s] }
            it 'returns true' do
              expect(terrain_rule.block?(type, piece_type_id)).to be_true
            end
          end

          context 'piece_type_id not included' do
            before { terrain_rule["block_#{type}_piece_type_ids"] = [] }
            it 'returns false' do
              expect(terrain_rule.block?(type, piece_type_id)).to be_false
            end
          end
        end

        context "block_#{type}_type == exclude" do
          before { terrain_rule["block_#{type}_type"] = 'exclude' }

          context 'piece_type_id included' do
            before { terrain_rule["block_#{type}_piece_type_ids"] = [piece_type_id.to_s] }
            it 'returns false' do
              expect(terrain_rule.block?(type, piece_type_id)).to be_false
            end
          end

          context 'piece_type_id not included' do
            before { terrain_rule["block_#{type}_piece_type_ids"] = [] }
            it 'returns true' do
              expect(terrain_rule.block?(type, piece_type_id)).to be_true
            end
          end
        end
      end
    end
  end
end
