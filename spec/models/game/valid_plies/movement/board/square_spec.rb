require 'spec_helper'

describe "Game#valid_plies - movement - board - square" do
  let(:piece_type) { create :piece_type }
  let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type}.merge(piece_rule_parameters) }

  let(:variant) { create :variant, board_type: 'square', board_rows: 5, board_columns: 5 }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action: 'move', action_to: user1 }

  let(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: {'x' => 2, 'y' => 2} }

  context "#valid_plies" do
    context 'orthogonal_line' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_line', movement_minimum: 1, movement_maximum: nil } }

      specify do
        expect( game.valid_plies(piece, piece.coordinate, 'movement') ).to match_array [
          {"x"=>3, "y"=>2}, {"x"=>4, "y"=>2},
          {"x"=>1, "y"=>2}, {"x"=>0, "y"=>2},
          {"x"=>2, "y"=>3}, {"x"=>2, "y"=>4},
          {"x"=>2, "y"=>1}, {"x"=>2, "y"=>0}
        ]
      end
    end

    context 'diagonal_line' do
      let(:piece_rule_parameters) { { movement_type: 'diagonal_line', movement_minimum: 1, movement_maximum: nil } }

      specify do
        expect( game.valid_plies(piece, piece.coordinate, 'movement') ).to match_array [
          {"x"=>3, "y"=>3}, {"x"=>4, "y"=>4},
          {"x"=>3, "y"=>1}, {"x"=>4, "y"=>0},
          {"x"=>1, "y"=>3}, {"x"=>0, "y"=>4},
          {"x"=>1, "y"=>1}, {"x"=>0, "y"=>0}
        ]
      end
    end

    context 'orthogonal_with_turns' do
      let(:piece_rule_parameters) { { movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

      specify do
        expect( game.valid_plies(piece, piece.coordinate, 'movement') ).to match_array [
          {"x"=>4, "y"=>2}, {"x"=>3, "y"=>3},
          {"x"=>2, "y"=>4}, {"x"=>1, "y"=>3},
          {"x"=>0, "y"=>2}, {"x"=>1, "y"=>1},
          {"x"=>2, "y"=>0}, {"x"=>3, "y"=>1},
        ]
      end
    end

    context 'diagonal_with_turns' do
      let(:piece_rule_parameters) { { movement_type: 'diagonal_with_turns', movement_minimum: 2, movement_maximum: 2 } }

      specify do
        expect( game.valid_plies(piece, piece.coordinate, 'movement') ).to match_array [
          {"x"=>0, "y"=>0}, {"x"=>2, "y"=>0},
          {"x"=>4, "y"=>0}, {"x"=>4, "y"=>2},
          {"x"=>4, "y"=>4}, {"x"=>2, "y"=>4},
          {"x"=>0, "y"=>4}, {"x"=>0, "y"=>2},
        ]
      end
    end
  end
end
