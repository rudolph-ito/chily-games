require 'spec_helper'

describe "Game#valid_plies - range - piece - enemy" do
  let(:piece_type) { create :piece_type }
  let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, capture_type: 'range', range_type: 'orthogonal_line', range_minimum: 2, range_maximum: 2 }

  let(:variant) { create :variant, board_type: 'square', board_rows: 5, board_columns: 5 }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action: 'move', action_to: user1 }

  let(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: {'x' => 2, 'y' => 2} }

  before do
    game.pieces.create!(piece_type: piece_type, user: user1, coordinate: {'x' => 2, 'y' => 0})
    game.pieces.create!(piece_type: piece_type, user: user1, coordinate: {'x' => 1, 'y' => 2})
  end

  specify do
    expect( game.valid_plies(piece, piece.coordinate, 'range') ).to match_array [{"x"=>4, "y"=>2}, {"x"=>2, "y"=>4}]
  end
end
