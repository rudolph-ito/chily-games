class Support

  def initialize(ply_calculator, pieces)
    @ply_calculator = ply_calculator
    @pieces = pieces

    create_map
  end

  def get(coordinate)
    @map[coordinate] || []
  end

  private

  def create_map
    @map = {}

    @pieces.each do |piece|
      attack_rank = piece.rule.attack_rank
      result = @ply_calculator.valid_plies(piece, piece.coordinate, piece.rule.capture_type, support: true)
      result.each do |coordinate|
        @map[coordinate] ||= []
        @map[coordinate] << attack_rank
      end
    end
  end

end
