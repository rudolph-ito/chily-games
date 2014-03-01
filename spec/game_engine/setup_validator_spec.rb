require 'spec_helper'

describe SetupValidator do
  let(:setup_validator) { SetupValidator.new(game, user) }
  let(:game) { create :game, alabaster: user, variant: variant, initial_setup_json: initial_setup_json }
  let(:user) { create :user }
  let(:variant) { create :variant, board_type: 'square', board_rows: 2, board_columns: 3 }
  let!(:piece_rule) { create(:piece_rule, piece_type: piece_type, variant: variant, count: 1) }
  let(:piece_type) { create :piece_type, name: 'King'}
  let!(:terrain_rule) { create(:terrain_rule, terrain_type: terrain_type, variant: variant, count: 1, block_movement_type: 'all') }
  let(:terrain_type) { create :terrain_type, name: 'Mountain'}

  describe '#call' do
    context 'setup is valid' do
      let(:initial_setup_json) { {'0,0'=>{'Piece'=>[piece_type.id, user.id]}, '1,0'=>{'Terrain'=>[terrain_type.id, user.id]}} }

      it 'returns true' do
        result, errors = setup_validator.call
        expect(result).to be_true
      end
    end

    context 'setup is invalid' do
      context 'too few of piece type' do
        let(:initial_setup_json) { {'1,0'=>{'Terrain'=>[terrain_type.id, user.id]}} }

        it 'returns false with errors' do
          result, errors = setup_validator.call
          expect(result).to be_false
          expect(errors).to eql ['Please place 1 king. You placed 0.']
        end
      end

      context 'too many of piece type' do
        let(:initial_setup_json) { {'0,0'=>{'Piece'=>[piece_type.id, user.id]}, '1,0'=>{'Terrain'=>[terrain_type.id, user.id]}, '2,0'=>{'Piece'=>[piece_type.id, user.id]}} }

        it 'returns false with errors' do
          result, errors = setup_validator.call
          expect(result).to be_false
          expect(errors).to eql ['Please place 1 king. You placed 2.']
        end
      end

      context 'too few of terrain type' do
        let(:initial_setup_json) { {'0,0'=>{'Piece'=>[piece_type.id, user.id]}} }

        it 'returns false with errors' do
          result, errors = setup_validator.call
          expect(result).to be_false
          expect(errors).to eql ['Please place 1 mountain. You placed 0.']
        end
      end

      context 'too many of terrain type' do
        let(:initial_setup_json) { {'0,0'=>{'Piece'=>[piece_type.id, user.id]}, '1,0'=>{'Terrain'=>[terrain_type.id, user.id]}, '2,0'=>{'Terrain'=>[terrain_type.id, user.id]}} }

        it 'returns false with errors' do
          result, errors = setup_validator.call
          expect(result).to be_false
          expect(errors).to eql ['Please place 1 mountain. You placed 2.']
        end
      end

      context 'piece on terrain that blocks its movement' do
        let(:initial_setup_json) { {'0,0'=>{'Piece'=>[piece_type.id, user.id], 'Terrain'=>[terrain_type.id, user.id]}} }

        it 'returns false with errors' do
          result, errors = setup_validator.call
          expect(result).to be_false
          expect(errors).to eql ['A king cannot be placed on a mountain.']
        end
      end
    end
  end
end
