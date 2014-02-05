require 'spec_helper'

describe "Game#valid_plies - movement - piece - enemy" do
  let(:piece_type) { create :piece_type }
  let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_maximum: nil, capture_type: capture_type }

  let(:variant) { create :variant, board_type: 'square', board_rows: 4, board_columns: 4 }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action: 'move', action_to: user1 }

  let(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: {'x' => 2, 'y' => 2} }

  before do
    game.pieces.create!(piece_type: piece_type, user: user2, coordinate: {'x' => 2, 'y' => 0})
    game.pieces.create!(piece_type: piece_type, user: user2, coordinate: {'x' => 1, 'y' => 2})
  end

  context 'capture_type == movement' do
    let(:capture_type) { 'movement' }

    specify do
      expect( game.valid_plies(piece, piece.coordinate, 'movement') ).to match_array [{"x"=>3, "y"=>2}, {"x"=>2, "y"=>3}, {"x"=>2, "y"=>1}, {'x' => 2, 'y' => 0}, {'x' => 1, 'y' => 2}]
    end
  end

  context 'capture_type == range' do
    let(:capture_type) { 'range' }

    specify do
      expect( game.valid_plies(piece, piece.coordinate, 'movement') ).to match_array [{"x"=>3, "y"=>2}, {"x"=>2, "y"=>3}, {"x"=>2, "y"=>1}]
    end
  end
end
