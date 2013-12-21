class Game < ActiveRecord::Base

  ########################################
  # Class Methods
  ########################################

  def self.actions
    %w( setup play )
  end

  ########################################
  # Relations
  ########################################

  belongs_to :action_to, class_name: 'User'
  belongs_to :alabaster, class_name: 'User'
  belongs_to :onyx, class_name: 'User'
  belongs_to :variant

  has_many :pieces
  has_many :terrains

  ########################################
  # Validations
  ########################################

  validates :action, inclusion: { in: self.actions }
  validates :alabaster, presence: true
  validates :onyx, presence: true
  validates :variant, presence: true

  ########################################
  # Instance Methods
  ########################################

  def board
    @board ||= "#{variant.board_type.camelize}Board".constantize.new(variant)
  end

  def color(user)
    if user.id == alabaster.id
      'alabaster'
    else
      'onyx'
    end
  end

  def setup_errors(user, pieces)
    errors = []

    duplicate_coordinates = pieces.map{ |x| x['coordinate'] }.duplicates
    unless duplicate_coordinates.empty?
      duplicate_coordinates.each do |c|
        errors << {'coordinate' => c, 'message' => 'Two pieces placed at the same coordinate.' }
      end
    end

    color = color(user)
    pieces.each do |piece|
      coordinate = piece['coordinate']
      territory = board.territory(coordinate)
      if territory == 'neutral'
        errors << {'coordinate' => coordinate, 'message' => 'Piece placed in neutral territory.' }
      elsif territory != color
        errors << {'coordinate' => coordinate, 'message' => 'Piece placed in enemy territory.' }
      end
    end

    if pieces.count != variant.number_of_pieces
      errors << { 'message' => "Rules require placing #{variant.number_of_pieces} pieces. You placed #{pieces.count}." }
    end

    variant.piece_rules.each do |pr|
      placed = pieces.count{ |p| p['piece_type_id'] == pr.piece_type_id }
      if placed < pr.count_minimum || placed > pr.count_maximum
        name = pr.piece_type.name.downcase
        name = name.pluralize if pr.count_maximum != 1
        errors << { 'message' => "Rules require placing #{pr.count} #{name}. You placed #{placed}." }
      end
    end

    errors
  end

  # # Ply: a hash with the following keys
  # #
  # # piece =>
  # # to =>

  # # Returns false if invalid
  # # Returns the valid ply (ply + more information) if valid
  # def ply_valid?(ply)
  #   return false if ply['piece'].user != action_to

  #   valid_plies(ply['piece']).each do |valid_ply|
  #     return valid_ply if ply['to'] == valid_ply['to']
  #   end

  #   return false
  # end

  # Returns the array of valid plies for a piece
  #
  # Each valid ply is a hash
  #  "to" => <coordinate>
  #  "capture" => <piece that is captured>
  def valid_plies(piece)
    rule = variant.piece_rules.find_by(piece_type_id: piece.piece_type.id)

    # Get movement_functions
    movement_functions = []
    movement_functions += board.movement_function('orthogonal') if rule.movement_type.include?('orthogonal')
    movement_functions += board.movement_function('diagonal') if rule.movement_type.include?('diagonal')

    if rule.movement_type.end_with?('line')
      line_plies(piece, rule, movement_functions)
    elsif rule.movement_type.end_with?('with_turns')
      turn_plies(piece, rule, movement_functions)
    end
  end

  private

  # Returns all plies for movement in a line
  #
  # piece = piece that is moving
  # rule = rule used to calulate movements
  # movement_functions = calculated from rule.movement_type and variant.board_type, precomputed for effeciency
  def line_plies(piece, rule, movement_functions)
    plies = []

    movement_functions.each do |movement_function|
      to = piece.coordinate.clone
      movement_count = 0

      while !(rule.movement_maximum && movement_count == rule.movement_maximum)
        movement_function.call(to)
        to = board.reduce_coordinate(to)
        movement_count += 1

        stop, ply = evaluate_ply(piece, rule, to, movement_count)
        plies << ply if ply
        break if stop
      end
    end

    plies
  end

  # Returns all plies for movement with turns
  #
  # piece = piece that is moving
  # rule = rule used to calulate movements
  # movement_functions = calculated from rule.movement_type and variant.board_type, precomputed for effeciency
  def turn_plies(piece, rule, movement_functions)
    _turn_plies(piece, rule, movement_functions, piece.coordinate, 0)
  end

  # Recursive function for turn_plies
  #
  # piece = piece that is moving
  # rule = rule used to calulate movements
  # movement_functions = calculated from rule.movement_type and variant.board_type, precomputed for effeciency
  # from = where the piece is moving from this deep in the search
  # movement_count = number of spaces moved from piece.coordinate to from
  def _turn_plies(piece, rule, movement_functions, from, movement_count)
    return [] if rule.movement_maximum && movement_count == rule.movement_maximum

    plies = []

    movement_functions.each do |movement_function|
      to = from.clone
      movement_function.call(to)
      to = board.reduce_coordinate(to)

      # Stop if distance did not grow
      next if board.distance(piece.coordinate, from) >= board.distance(piece.coordinate, to)

      stop, ply = evaluate_ply(piece, rule, to, movement_count + 1)
      plies << ply if ply
      next if stop

      # Continue
      plies += _turn_plies(piece, rule, movement_functions, to, movement_count + 1)
    end

    plies
  end

  # Shared ply evaluation between line_plies and turn_plies
  #
  # Returns [stop, ply]
  def evaluate_ply(piece, rule, to, movement_count)
    ply = nil

    # Stop if off the board
    return true if board.coordinate_invalid?(to)

    # Get piece at square
    occupied_by = pieces.detect{ |p| p.coordinate == to }

    # Stop if ran into own piece
    return true if occupied_by && occupied_by.user == piece.user

    # Create ply (unless not above minimum)
    unless movement_count < rule.movement_minimum
      ply = { 'to' => to.clone, 'capture' => occupied_by }
    end

    return [occupied_by, ply]
  end

end