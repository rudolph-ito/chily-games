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

  context 'movement' do
    let(:piece_rule_parameters) { { capture_type: 'movement' } }

    context 'valid' do
      it 'returns Game::PLY_VALID' do
        expect( game.ply_valid?(from_coordinate, valid_to_coordinate) ).to eql Game::PLY_VALID
      end

      context 'captures by range' do
        let(:piece_rule_parameters) { { capture_type: 'range' } }

        it 'returns Game::PLY_RANGE_CAPTURE_REQUIRED' do
          expect( game.ply_valid?(from_coordinate, valid_to_coordinate) ).to eql Game::PLY_RANGE_CAPTURE_REQUIRED
        end
      end
    end

    context 'invalid' do
      it 'returns Game::PLY_INVALID' do
        expect( game.ply_valid?(from_coordinate, invalid_to_coordinate) ).to eql Game::PLY_INVALID
      end
    end
  end

  context "movement_capture" do
    let(:piece_rule_parameters) { { capture_type: 'movement' } }
    let!(:enemy_piece) { create :piece, game: game, user: user2, piece_type: piece_type, coordinate: valid_to_coordinate }

    it 'returns Game::PLY_VALID' do
      expect( game.ply_valid?(from_coordinate, valid_to_coordinate) ).to eql Game::PLY_VALID
    end
  end

  context "range_capture" do
    let(:piece_rule_parameters) { { capture_type: 'range' } }
    let!(:enemy_piece) { create :piece, game: game, user: user2, piece_type: piece_type, coordinate: valid_range_capture_coordinate }

    context 'valid' do
      it 'returns Game::PLY_VALID' do
        expect( game.ply_valid?(from_coordinate, valid_to_coordinate, valid_range_capture_coordinate) ).to eql Game::PLY_VALID
      end
    end

    context 'invalid' do
      it 'returns Game::PLY_INVALID' do
        expect( game.ply_valid?(from_coordinate, valid_to_coordinate, invalid_range_capture_coordinate) ).to eql Game::PLY_INVALID
      end
    end
  end
end
