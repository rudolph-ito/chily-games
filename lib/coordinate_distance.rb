class CoordinateDistance

  def self.calculate(coordinate1, coordinate2)
    sum = coordinate1.keys.inject(0) do |sum, key|
      sum + (coordinate1[key] - coordinate2[key]) ** 2
    end
    Math.sqrt(sum)
  end
end
