class Board

  def initialize(variant)
    @variant = variant
    @memo = {}
  end

  ########################################
  # Coordinates
  ########################################

  # Return true if and only if the space is on the board
  def coordinate_valid?(coord)
    # override
  end

  # Return true if and only if the space is not on the board
  def coordinate_invalid?(coord)
    !coordinate_valid?(coord)
  end

  # Reduce coordinate
  def reduce_coordinate(coord)
    coord
  end

  # Return the coordinate that is considered the center of the board
  def center_coordinate
    # Override
  end

  def distance(coordinate1, coordinate2)
    sum = coordinate1.keys.inject(0) do |sum, key|
      sum + (coordinate1[key] - coordinate2[key]) ** 2
    end

    Math.sqrt(sum)
  end

  ########################################
  # Initial Setup
  ########################################

  # Returns the territory the coord belongs to during setup, must one of the following:
  #   'alabaster'
  #   'neutral'
  #   'onyx'
  def territory(coord)
    # Override
  end

  ########################################
  # Plies
  ########################################

  def movement_function(key)
    # Override
  end

end