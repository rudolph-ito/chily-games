class CoordinateDistance

  def self.calculate(c1, c2)
    x_diff = x_value(c1) - x_value(c2)
    y_diff = y_value(c1) - y_value(c2)
    Math.sqrt(x_diff ** 2 + y_diff ** 2).round(2)
  end

  private

  def self.x_value(c)
    if c.has_key?('z')
      c['x'] + c['y'] * delta_x - c['z'] * delta_x
    else
      c['x']
    end
  end

  def self.y_value(c)
    if c.has_key?('z')
      c['y'] * delta_y + c['z'] * delta_y
    else
      c['y']
    end
  end

  def self.delta_x
    @delta_x ||= 0.5
  end

  def self.delta_y
    @delta_y ||= Math.cos(Math::PI / 6)
  end

end
