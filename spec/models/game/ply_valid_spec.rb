require 'spec_helper'

describe "Game#ply_valid? - movement" do
  let(:piece_type) { create :piece_type }
  let(:piece_rule_parameters) { {} }
  let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_minimum: 2, movement_maximum: 2}.merge(piece_rule_parameters) }

  let(:variant) { create :variant, board_type: 'hexagonal', board_size: 4  }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action: 'move', action_to: user1 }

  let(:from_coordinate) { {'x' => 0, 'y' => 0, 'z' => 0} }
  let(:valid_to_coordinate) { {'x' => 2, 'y' => 0, 'z' => 0} }
  let(:invalid_to_coordinate) { {'x' => 2, 'y' => 1, 'z' => 0} }
  let(:valid_range_capture_coordinate) { {'x' => 3, 'y' => 0, 'z' => 0} }
  let(:invalid_range_capture_coordinate) { {'x' => 3, 'y' => 1, 'z' => 0} }
  let!(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: from_coordinate }

  context "movement_capture" do
    let(:piece_rule_parameters) { { capture_type: 'movement' } }

    context 'valid' do
      it 'returns true' do
        expect( game.ply_valid?(piece, valid_to_coordinate) ).to be_true
      end
    end

    context 'invalid' do
      it 'returns false' do
        expect( game.ply_valid?(piece, invalid_to_coordinate) ).to be_false
      end
    end
  end

  context "range_capture" do
    let(:piece_rule_parameters) { { capture_type: 'range' } }

    context 'valid' do
      it 'returns true' do
        expect( game.ply_valid?(piece, valid_to_coordinate) ).to be_true
      end

      context 'with range capture' do
        it 'returns true' do
          expect( game.ply_valid?(piece, valid_to_coordinate, valid_range_capture_coordinate) ).to be_true
        end
      end
    end

    context 'invalid' do
      it 'returns false' do
        expect( game.ply_valid?(piece, invalid_to_coordinate) ).to be_false
      end

      context 'with range capture' do
        it 'returns false' do
          expect( game.ply_valid?(piece, valid_to_coordinate, invalid_range_capture_coordinate) ).to be_false
        end
      end
    end
  end
end
