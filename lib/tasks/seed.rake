namespace :seed do

  desc "Create basic variants for testing"
  task :variants => :environment do
    ########################################
    # Users
    ########################################

    unless User.find_by(username: 'user1')
      User.create!(username: 'user1', email: 'user1@cyvasse.com', password: '12345678', password_confirmation: '12345678', admin: false)
    end

    unless User.find_by(username: 'user2')
      User.create!(username: 'user2', email: 'user2@cyvasse.com', password: '12345678', password_confirmation: '12345678', admin: false)
    end

    ########################################
    # Variants
    ########################################

    admin = User.find_by(username: 'admin')
    user1 = User.find_by(username: 'user1')
    user2 = User.find_by(username: 'user2')

    unless Variant.find_by(user_id: admin.id)
      variant = Variant.create!(user_id: admin.id, board_type: 'hexagonal', board_size: 2)
    end

    unless Variant.find_by(user_id: user1.id)
      variant = Variant.create!(user_id: user1.id, board_type: 'square', board_rows: 7, board_columns: 7)

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Dragon'), count: 1,
        movement_minimum: 1, movement_maximum: nil, movement_type: 'orthogonal_or_diagonal_line',
        capture_type: 'movement'
      )

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Crossbow'), count: 1,
        movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
        capture_type: 'range',
        range_minimum: 1, range_maximum: 1, range_type: 'diagonal_line'
      )

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Trebuchet'), count: 1,
        movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
        capture_type: 'range',
        range_minimum: 2, range_maximum: 4, range_type: 'orthogonal_line'
      )

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Light Horse'), count: 1,
        movement_minimum: 2, movement_maximum: 3, movement_type: 'orthogonal_with_turns',
        capture_type: 'movement'
      )

      variant.terrain_rules.create!(
        terrain_type: TerrainType.find_by(name: 'Mountain'), count: 3,
        passable_movement_effect_type: 'exclude', passable_movement_effect_piece_type_ids: [PieceType.find_by(name: 'Dragon').id.to_s],
        passable_range_effect_type: 'none',
        slows_movement_effect_type: 'none',
        stops_movement_effect_type: 'none'
      )
    end


    unless Variant.find_by(user_id: user2.id)
      variant = Variant.create!(user_id: user2.id, board_type: 'hexagonal', board_size: 4)

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Dragon'), count: 1,
        movement_minimum: 1, movement_maximum: nil, movement_type: 'orthogonal_line',
        capture_type: 'movement',
      )

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Trebuchet'), count: 1,
        movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
        capture_type: 'range',
        range_minimum: 2, range_maximum: 4, range_type: 'orthogonal_line'
      )

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Crossbow'), count: 1,
        movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
        capture_type: 'range',
        range_minimum: 1, range_maximum: 1, range_type: 'diagonal_line'
      )

      variant.piece_rules.create!(
        piece_type: PieceType.find_by(name: 'Light Horse'), count: 1,
        movement_minimum: 2, movement_maximum: 3, movement_type: 'orthogonal_with_turns',
        capture_type: 'movement'
      )

      variant.terrain_rules.create!(
        terrain_type: TerrainType.find_by(name: 'Mountain'), count: 3,
        passable_movement_effect_type: 'exclude', passable_movement_effect_piece_type_ids: [PieceType.find_by(name: 'Dragon').id.to_s],
        passable_range_effect_type: 'none',
        slows_movement_effect_type: 'none',
        stops_movement_effect_type: 'none'
      )
    end
  end

end
